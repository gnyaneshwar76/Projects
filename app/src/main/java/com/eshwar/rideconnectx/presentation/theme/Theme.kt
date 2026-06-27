package com.eshwar.rideconnectx.presentation.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val RideConnectXDarkPalette = darkColorScheme(
    primary = Color(0xFF4FC3F7), // Soft Blue
    secondary = Color(0xFF64FFDA), // Soft Teal
    background = Color(0xFF0A0A0F), // Near Black
    surface = Color(0xFF1A1A2E), // Dark Navy
    onPrimary = Color.Black,
    onSecondary = Color.Black,
    onBackground = Color.White,
    onSurface = Color.White,
    outline = Color(0xFF2A2A3E),
    error = Color(0xFFF44336),
    primaryContainer = Color(0xFF4FC3F7).copy(alpha = 0.1f)
)

@Composable
fun RideConnectXTheme(
    content: @Composable () -> Unit
) {
    // Always Dark Mode for RideConnectX
    MaterialTheme(
        colorScheme = RideConnectXDarkPalette,
        content = content
    )
}
