package com.eshwar.rideconnectx.domain.repository

import com.eshwar.rideconnectx.domain.model.BleDevice
import kotlinx.coroutines.flow.Flow

interface BleRepository {
    fun scanDevices(): Flow<List<BleDevice>>
    fun stopScan()
    fun connect(address: String): Flow<ConnectionState>
    fun disconnect()
    fun sendPacket(packet: ByteArray): Flow<Boolean>
    fun observeNotifications(): Flow<BlePacket>
}

data class BlePacket(
    val characteristicUuid: String,
    val data: ByteArray,
    val timestamp: Long = System.currentTimeMillis()
)
