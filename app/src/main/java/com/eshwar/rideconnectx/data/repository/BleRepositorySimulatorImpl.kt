package com.eshwar.rideconnectx.data.repository

import com.eshwar.rideconnectx.domain.model.BleDevice
import com.eshwar.rideconnectx.domain.repository.BlePacket
import com.eshwar.rideconnectx.domain.repository.BleRepository
import com.eshwar.rideconnectx.domain.repository.ConnectionState
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BleRepositorySimulatorImpl @Inject constructor() : BleRepository {

    override fun scanDevices(): Flow<List<BleDevice>> = flow {
        val mockDevices = listOf(
            BleDevice("SAS-SIM-AVENIS", "00:11:22:33:44:55", -55),
            BleDevice("SUZUKI-SIM-BURGMAN", "AA:BB:CC:DD:EE:FF", -62)
        )
        while (true) {
            emit(mockDevices)
            delay(2000)
        }
    }

    override fun stopScan() {}

    override fun connect(address: String): Flow<ConnectionState> = flow {
        emit(ConnectionState.Connecting(address, "Simulated Scooter"))
        delay(1500)
        emit(ConnectionState.Connected(address, "Simulated Scooter"))
    }

    override fun disconnect() {}

    override fun sendPacket(packet: ByteArray): Flow<Boolean> = flow {
        emit(true)
    }

    override fun observeNotifications(): Flow<BlePacket> = flow {
        // Telemetry parsing suspended
    }
}
