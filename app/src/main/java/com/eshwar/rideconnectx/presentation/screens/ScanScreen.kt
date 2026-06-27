package com.eshwar.rideconnectx.presentation.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.eshwar.rideconnectx.domain.model.BleDevice
import com.eshwar.rideconnectx.domain.repository.ConnectionState
import com.eshwar.rideconnectx.presentation.viewmodel.ScanUiEffect
import com.eshwar.rideconnectx.presentation.viewmodel.ScanUiIntent
import com.eshwar.rideconnectx.presentation.viewmodel.ScanViewModel

@Composable
fun ScanScreen(
    onNavigateToDashboard: (String) -> Unit,
    viewModel: ScanViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val isScanning = uiState.connectionState is ConnectionState.Scanning

    LaunchedEffect(Unit) {
        viewModel.effect.collect { effect ->
            when (effect) {
                is ScanUiEffect.NavigateToDashboard -> onNavigateToDashboard(effect.address)
            }
        }
    }

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .navigationBarsPadding(),
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .padding(24.dp)
        ) {
            Text(
                text = "RideConnectX",
                fontSize = 32.sp,
                fontWeight = FontWeight.Black,
                color = MaterialTheme.colorScheme.primary
            )
            Text(
                text = "Scooter Discovery",
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.secondary,
                modifier = Modifier.padding(bottom = 32.dp)
            )

            // Last Session Card
            if (uiState.lastDeviceAddress != null) {
                LastConnectedCard(
                    name = uiState.lastDeviceName ?: "Unknown Scooter",
                    address = uiState.lastDeviceAddress!!,
                    onReconnect = { viewModel.onIntent(ScanUiIntent.SelectDevice(uiState.lastDeviceAddress!!)) }
                )
                Spacer(modifier = Modifier.height(24.dp))
            }

            Button(
                onClick = { 
                    if (isScanning) viewModel.onIntent(ScanUiIntent.StopScan)
                    else viewModel.onIntent(ScanUiIntent.StartScan)
                },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                enabled = uiState.isBluetoothEnabled && uiState.isLocationEnabled
            ) {
                Text(if (isScanning) "Stop Discovery" else "Search for Scooters")
            }

            if (isScanning) {
                LinearProgressIndicator(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 16.dp),
                    color = MaterialTheme.colorScheme.primary,
                    trackColor = MaterialTheme.colorScheme.surface
                )
            }

            if (!isScanning && uiState.devices.isEmpty() && uiState.lastDeviceAddress == null) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No Suzuki scooter found nearby", color = MaterialTheme.colorScheme.outline)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(uiState.devices, key = { it.address }) { device ->
                    CleanDeviceCard(
                        name = device.name ?: "Unknown Scooter",
                        isSaved = device.address == uiState.lastDeviceAddress,
                        onConnect = { 
                            viewModel.onIntent(ScanUiIntent.StopScan)
                            viewModel.onIntent(ScanUiIntent.SelectDevice(device.address)) 
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun LastConnectedCard(name: String, address: String, onReconnect: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.5f))
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(text = "Last Connected", fontSize = 12.sp, color = MaterialTheme.colorScheme.primary)
                Text(text = name, fontSize = 20.sp, fontWeight = FontWeight.Bold)
            }
            Button(onClick = onReconnect) {
                Text("Reconnect")
            }
        }
    }
}

@Composable
fun CleanDeviceCard(name: String, isSaved: Boolean, onConnect: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Row(
            modifier = Modifier.padding(20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(text = name, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Text(
                    text = if (isSaved) "Your Scooter" else "Suzuki Scooter Found",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.secondary
                )
            }
            Button(onClick = onConnect, shape = RoundedCornerShape(8.dp)) {
                Text("Connect")
            }
        }
    }
}
