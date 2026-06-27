package com.eshwar.rideconnectx.data.repository

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.IBinder
import com.eshwar.rideconnectx.data.ble.BleForegroundService
import com.eshwar.rideconnectx.data.ble.BleScannerImpl
import com.eshwar.rideconnectx.data.ble.ScooterCandidateFilter
import com.eshwar.rideconnectx.data.local.SessionDataStore
import com.eshwar.rideconnectx.domain.model.BleDevice
import com.eshwar.rideconnectx.domain.repository.BlePacket
import com.eshwar.rideconnectx.domain.repository.BleRepository
import com.eshwar.rideconnectx.domain.repository.ConnectionState
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import android.util.Log
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BleRepositoryImpl @Inject constructor(
    @ApplicationContext private val context: Context,
    private val scanner: BleScannerImpl,
    private val sessionDataStore: SessionDataStore
) : BleRepository {
    private val TAG = "RCX-BLE"
    private val repositoryScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var bleService: BleForegroundService? = null
    private val _isServiceBound = MutableStateFlow(false)

    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            val binder = service as BleForegroundService.LocalBinder
            bleService = binder.getService()
            _isServiceBound.value = true
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            bleService = null
            _isServiceBound.value = false
        }
    }

    private fun ensureServiceStarted() {
        if (!_isServiceBound.value) {
            Intent(context, BleForegroundService::class.java).also { intent ->
                context.bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE)
                context.startForegroundService(intent)
            }
        }
    }

    override fun scanDevices(): Flow<List<BleDevice>> {
        ensureServiceStarted()
        return scanner.scanDevices()
    }

    override fun stopScan() {
        scanner.stopScan()
    }

    @OptIn(ExperimentalCoroutinesApi::class)
    override fun connect(address: String): Flow<ConnectionState> {
        Log.d(TAG, "Connect requested: $address")
        ensureServiceStarted()
        
        return _isServiceBound.filter { it }.flatMapLatest {
            val device = bleService?.getDeviceByAddress(address)
            val name = device?.name ?: "Suzuki Scooter"

            // Filter Check before connection
            if (!ScooterCandidateFilter.isSuzukiScooterCandidate(name, address, null)) {
                Log.d(TAG, "Unsupported device rejected: $address")
                return@flatMapLatest flowOf(ConnectionState.UnsupportedDevice)
            }

            bleService?.connect(address)
            bleService?.connectionState?.map { state ->
                when (state) {
                    android.bluetooth.BluetoothProfile.STATE_CONNECTED -> {
                        Log.d(TAG, "GATT connected: $address")
                        // In real app, we wait for service discovery. 
                        // Service discovery and validation happens in the Service's callback
                        // For MVI Flow, we emit based on service state
                        repositoryScope.launch {
                            sessionDataStore.saveSession(address, name)
                        }
                        ConnectionState.Connected(address, name)
                    }
                    android.bluetooth.BluetoothProfile.STATE_CONNECTING -> {
                        Log.d(TAG, "GATT connecting: $address")
                        ConnectionState.Connecting(address, name)
                    }
                    android.bluetooth.BluetoothProfile.STATE_DISCONNECTED -> {
                        Log.d(TAG, "Disconnected: $address")
                        ConnectionState.Disconnected("Scooter disconnected")
                    }
                    else -> ConnectionState.Failed("Connection failed")
                }
            } ?: flowOf(ConnectionState.Failed("Service unavailable"))
        }
    }

    override fun disconnect() {
        Log.d(TAG, "User disconnect requested")
        bleService?.disconnect()
    }

    override fun sendPacket(packet: ByteArray): Flow<Boolean> {
        // Placeholder for GATT write
        return flowOf(true)
    }

    @OptIn(ExperimentalCoroutinesApi::class)
    override fun observeNotifications(): Flow<BlePacket> {
        return _isServiceBound.filter { it }.flatMapLatest {
            bleService?.notifications?.map { (uuid, data) ->
                BlePacket(uuid, data)
            } ?: emptyFlow()
        }
    }
}
