package com.eshwar.rideconnectx.data.ble

import android.annotation.SuppressLint
import android.app.*
import android.bluetooth.*
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Binder
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.eshwar.rideconnectx.MainActivity
import com.eshwar.rideconnectx.R
import com.eshwar.rideconnectx.core.ble.GattCommand
import com.eshwar.rideconnectx.core.ble.GattCommandQueue
import com.eshwar.rideconnectx.domain.model.BleDevice
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import java.util.UUID

@AndroidEntryPoint
class BleForegroundService : Service() {
    private val TAG = "RCX-BLE"
    private val binder = LocalBinder()
    private var bluetoothGatt: BluetoothGatt? = null
    private val commandQueue = GattCommandQueue()
    private var connectedDeviceName: String = "Suzuki Scooter"
    
    private val _connectionState = MutableSharedFlow<Int>(replay = 1)
    val connectionState = _connectionState.asSharedFlow()

    private val _notifications = MutableSharedFlow<Pair<String, ByteArray>>()
    val notifications = _notifications.asSharedFlow()

    private val gattCallback = object : BluetoothGattCallback() {
        @SuppressLint("MissingPermission")
        override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
            Log.d(TAG, "onConnectionStateChange: status=$status, newState=$newState")
            _connectionState.tryEmit(newState)
            
            when (newState) {
                BluetoothProfile.STATE_CONNECTED -> {
                    Log.d(TAG, "GATT connected")
                    updateNotification("Connected to $connectedDeviceName")
                    commandQueue.addCommand(GattCommand.RequestMtu(517), gatt)
                }
                BluetoothProfile.STATE_CONNECTING -> {
                    Log.d(TAG, "GATT connecting")
                    updateNotification("Connecting to scooter...")
                }
                BluetoothProfile.STATE_DISCONNECTED -> {
                    Log.d(TAG, "GATT disconnected (Status: $status)")
                    updateNotification("Disconnected")
                    cleanup()
                }
            }
        }

        override fun onMtuChanged(gatt: BluetoothGatt, mtu: Int, status: Int) {
            Log.d(TAG, "onMtuChanged: mtu=$mtu, status=$status")
            commandQueue.onCommandCompleted(gatt)
            commandQueue.addCommand(GattCommand.DiscoverServices(), gatt)
        }

        @SuppressLint("MissingPermission")
        override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
            Log.d(TAG, "onServicesDiscovered: status=$status")
            commandQueue.onCommandCompleted(gatt)
            
            if (status == BluetoothGatt.GATT_SUCCESS) {
                val services = gatt.services
                Log.d(TAG, "Services discovered: ${services.size}")
                services.forEach { service ->
                    Log.d(TAG, "Service: ${service.uuid}")
                    service.characteristics.forEach { char ->
                        val props = char.properties
                        if (props and BluetoothGattCharacteristic.PROPERTY_WRITE != 0 || 
                            props and BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE != 0) {
                            Log.d(TAG, "Writable characteristic found: ${char.uuid}")
                        }
                        if (props and BluetoothGattCharacteristic.PROPERTY_NOTIFY != 0) {
                            Log.d(TAG, "Notify characteristic found: ${char.uuid}")
                            // Enable notifications automatically for known suzuki characteristics if needed
                        }
                    }
                }
            }
        }

        override fun onDescriptorWrite(gatt: BluetoothGatt, descriptor: BluetoothGattDescriptor, status: Int) {
            if (status == BluetoothGatt.GATT_SUCCESS) {
                Log.d(TAG, "Notification enabled success: ${descriptor.characteristic.uuid}")
            } else {
                Log.d(TAG, "Notification enabled failed: ${descriptor.characteristic.uuid}")
            }
            commandQueue.onCommandCompleted(gatt)
        }

        override fun onCharacteristicWrite(gatt: BluetoothGatt, characteristic: BluetoothGattCharacteristic, status: Int) {
            commandQueue.onCommandCompleted(gatt)
        }

        override fun onCharacteristicChanged(gatt: BluetoothGatt, characteristic: BluetoothGattCharacteristic, value: ByteArray) {
            Log.d(TAG, "Characteristic changed received: UUID=${characteristic.uuid}, Length=${value.size}, Hex=${value.toHexString().take(20)}...")
            _notifications.tryEmit(characteristic.uuid.toString() to value)
        }
        
        @Deprecated("Deprecated in Java")
        override fun onCharacteristicChanged(gatt: BluetoothGatt, characteristic: BluetoothGattCharacteristic) {
            @Suppress("DEPRECATION")
            val value = characteristic.value
            Log.d(TAG, "Characteristic changed received (Legacy): UUID=${characteristic.uuid}, Length=${value?.size ?: 0}")
            value?.let { _notifications.tryEmit(characteristic.uuid.toString() to it) }
        }
    }

    private fun ByteArray.toHexString(): String = joinToString("") { "%02x".format(it) }

    inner class LocalBinder : Binder() {
        fun getService(): BleForegroundService = this@BleForegroundService
    }

    override fun onBind(intent: Intent): IBinder = binder

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForegroundServiceWithNotification()
    }

    private fun startForegroundServiceWithNotification() {
        val notification = createNotification("Starting RideConnectX...")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(1, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE)
        } else {
            startForeground(1, notification)
        }
    }

    @SuppressLint("MissingPermission")
    fun connect(deviceAddress: String) {
        Log.d(TAG, "Connect requested: $deviceAddress")
        val manager = getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
        val adapter = manager.adapter
        if (adapter == null) {
            Log.e(TAG, "Bluetooth Adapter is null, cannot connect")
            _connectionState.tryEmit(BluetoothProfile.STATE_DISCONNECTED)
            return
        }
        
        val device = adapter.getRemoteDevice(deviceAddress)
        connectedDeviceName = device.name ?: "Suzuki Scooter"
        
        bluetoothGatt?.disconnect()
        bluetoothGatt?.close()
        
        bluetoothGatt = device.connectGatt(this, false, gattCallback)
    }

    fun getDeviceByAddress(address: String): BleDevice? {
        val manager = getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
        val adapter = manager.adapter ?: return null
        return try {
            val device = adapter.getRemoteDevice(address)
            BleDevice(name = device.name, address = device.address, rssi = 0)
        } catch (e: Exception) {
            null
        }
    }

    @SuppressLint("MissingPermission")
    fun disconnect() {
        Log.d(TAG, "User disconnect requested")
        bluetoothGatt?.disconnect()
    }

    @SuppressLint("MissingPermission")
    private fun cleanup() {
        bluetoothGatt?.close()
        bluetoothGatt = null
        commandQueue.clear()
    }

    private fun updateNotification(text: String) {
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(1, createNotification(text))
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "ride_connect_x",
                "RideConnectX BLE Service",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(text: String): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_IMMUTABLE)

        val disconnectIntent = Intent(this, BleForegroundService::class.java).apply {
            action = "ACTION_DISCONNECT"
        }
        val disconnectPendingIntent = PendingIntent.getService(this, 1, disconnectIntent, PendingIntent.FLAG_IMMUTABLE)

        return NotificationCompat.Builder(this, "ride_connect_x")
            .setContentTitle("RideConnectX")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.stat_sys_data_bluetooth)
            .setContentIntent(pendingIntent)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Disconnect", disconnectPendingIntent)
            .build()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == "ACTION_DISCONNECT") {
            disconnect()
        } else {
            // Ensure service is in foreground if started again
            startForegroundServiceWithNotification()
        }
        return START_STICKY
    }
}
