package com.eshwar.rideconnectx.domain

/**
 * Single source of truth for the Suzuki Ride Connect Protocol.
 * Frame: [0xA5] (1 byte) | Payload (27 bytes) | Checksum (1 byte) | [0x7F] (1 byte)
 * Total: 30 bytes
 */
object ProtocolEngine {
    private const val START_BYTE = 0xA5.toByte()
    private const val END_BYTE = 0x7F.toByte()
    private const val PACKET_LENGTH = 30

    fun buildPacket(type: Int, payload: ByteArray): ByteArray {
        val frame = ByteArray(PACKET_LENGTH)
        frame[0] = START_BYTE
        
        // Byte 1 is typically the packet type/ID
        frame[1] = type.toByte()
        
        // Fill payload starting from Byte 2
        payload.copyInto(frame, destinationOffset = 2, endIndex = minOf(payload.size, 26))
        
        // Calculate Checksum at Byte 28
        frame[28] = calculateChecksum(frame)
        frame[29] = END_BYTE
        
        return frame
    }

    private fun calculateChecksum(frame: ByteArray): Byte {
        var sum = 0
        // Sum bytes 1 to 27 inclusive
        for (i in 1..27) {
            sum += frame[i].toInt() and 0xFF
        }
        return (sum % 256).toByte()
    }

    fun sanitizeString(input: String): String {
        // Remove non-ASCII characters to prevent cluster display crashes
        return input.filter { it.code in 32..126 }
    }

    /**
     * Build Packet 7: Navigation Maneuver
     */
    fun buildNavigationPacket(maneuverId: Int, distance: String): ByteArray {
        val payload = ByteArray(27)
        // Byte 1 (Index 2 in frame) is usually Maneuver ID
        payload[0] = maneuverId.toByte()
        
        // Sanitize and copy distance string
        val sanitizedDistance = sanitizeString(distance).toByteArray(Charsets.US_ASCII)
        sanitizedDistance.copyInto(payload, destinationOffset = 1, endIndex = minOf(sanitizedDistance.size, 26))
        
        return buildPacket(PacketType.NAVIGATION_MANEUVER, payload)
    }

    /**
     * Build Packet 6: Notification (SMS/WhatsApp)
     */
    fun buildNotificationPacket(appIdentifier: Char, title: String, message: String): ByteArray {
        val payload = ByteArray(27)
        // Byte 0 of payload is the app identifier ('W', 'N', etc.)
        payload[0] = appIdentifier.code.toByte()
        
        val content = sanitizeString("$title: $message").toByteArray(Charsets.US_ASCII)
        content.copyInto(payload, destinationOffset = 1, endIndex = minOf(content.size, 26))
        
        return buildPacket(PacketType.NOTIFICATION, payload)
    }
    
    // Packet Types identified in Knowledge Base
    object PacketType {
        const val NOTIFICATION = 6
        const val NAVIGATION_MANEUVER = 7
        const val DISTANCE_ETA = 8
        const val MISSED_CALL = 34
        const val GREETING = 36
        const val WHATSAPP_CALL = 61
    }
    
    // Maneuver IDs identified in Knowledge Base
    object Maneuver {
        const val DESTINATION = 11
        const val TURN_LEFT = 40
        const val TURN_RIGHT = 41
        const val SLIGHT_LEFT = 42
        const val SLIGHT_RIGHT = 43
        const val SHARP_LEFT = 44
        const val SHARP_RIGHT = 45
        const val DISTANCE_INFO = 46
        const val U_TURN = 48
        const val KEEP_LEFT = 49
        const val KEEP_RIGHT = 50
        const val ROUNDABOUT = 51
        const val MERGE = 53
    }
}
