package com.eshwar.rideconnectx.presentation.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.eshwar.rideconnectx.domain.repository.ConnectionState
import com.eshwar.rideconnectx.presentation.viewmodel.DashboardUiIntent
import com.eshwar.rideconnectx.presentation.viewmodel.DashboardViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onBack: () -> Unit,
    viewModel: DashboardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var showDisconnectMenu by remember { mutableStateOf(false) }
    var showExitDialog by remember { mutableStateOf(false) }

    // Navigation back handling
    LaunchedEffect(uiState.connectionState) {
        if (uiState.connectionState is ConnectionState.Disconnected) {
            onBack()
        }
    }

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .navigationBarsPadding(),
        topBar = {
            TopAppBar(
                title = { 
                    Column {
                        Text("RideConnectX", fontSize = 18.sp, fontWeight = FontWeight.Black)
                        ConnectionStatusBadge(uiState.connectionState)
                    }
                },
                actions = {
                    IconButton(onClick = { showDisconnectMenu = true }) {
                        Icon(Icons.Default.MoreVert, contentDescription = "Menu")
                    }
                    DropdownMenu(
                        expanded = showDisconnectMenu,
                        onDismissRequest = { showDisconnectMenu = false }
                    ) {
                        DropdownMenuItem(
                            text = { Text("Disconnect") },
                            onClick = { 
                                showDisconnectMenu = false
                                viewModel.onIntent(DashboardUiIntent.Disconnect)
                            },
                            leadingIcon = { Icon(Icons.Default.PowerSettingsNew, contentDescription = null) }
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent)
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Box(modifier = Modifier.padding(padding).fillMaxSize()) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Scooter Name Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Bluetooth, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(text = uiState.deviceName, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                            Text(text = "Suzuki Scooter", fontSize = 12.sp, color = MaterialTheme.colorScheme.secondary)
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(32.dp))
                
                // Speedometer Gauge
                Box(
                    modifier = Modifier
                        .size(240.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.surface)
                        .padding(8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    // Outer border ring
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .border(4.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.2f), CircleShape)
                    )
                    
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = uiState.speed?.toString() ?: "--",
                            fontSize = 80.sp,
                            fontWeight = FontWeight.Black,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            text = "KM/H",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.secondary
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(32.dp))
                
                // Telemetry Grid
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    TelemetryCard(
                        label = "Battery",
                        value = uiState.battery?.let { "$it%" } ?: "Waiting for data...",
                        icon = Icons.Default.BatteryChargingFull,
                        modifier = Modifier.weight(1f)
                    )
                    TelemetryCard(
                        label = "Fuel",
                        value = uiState.fuel?.let { "$it%" } ?: "Waiting for data...",
                        icon = Icons.Default.LocalGasStation,
                        modifier = Modifier.weight(1f)
                    )
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    TelemetryCard(
                        label = "Trip A",
                        value = uiState.odometer?.let { "$it km" } ?: "Waiting for data...",
                        icon = Icons.Default.Route,
                        modifier = Modifier.weight(1f)
                    )
                    TelemetryCard(
                        label = "Odometer",
                        value = uiState.odometer?.let { "$it km" } ?: "Waiting for data...",
                        icon = Icons.Default.Speed,
                        modifier = Modifier.weight(1f)
                    )
                }
                
                Spacer(modifier = Modifier.weight(1f))
                
                // Navigation Button
                Button(
                    onClick = { /* Coming Soon */ },
                    enabled = false,
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(
                        disabledContainerColor = MaterialTheme.colorScheme.surface,
                        disabledContentColor = MaterialTheme.colorScheme.outline
                    )
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Navigation, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Navigation (Coming Soon)")
                    }
                }
            }
            
            // Disconnect Overlay
            if (uiState.connectionState is ConnectionState.Disconnected || uiState.connectionState is ConnectionState.Failed) {
                Box(
                    modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.8f)),
                    contentAlignment = Alignment.Center
                ) {
                    Card(
                        modifier = Modifier.padding(32.dp),
                        shape = RoundedCornerShape(24.dp)
                    ) {
                        Column(modifier = Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                imageVector = Icons.Default.BluetoothDisabled, 
                                contentDescription = null, 
                                modifier = Modifier.size(48.dp), 
                                tint = Color.Red
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text("Scooter Disconnected", fontWeight = FontWeight.Bold, fontSize = 20.sp)
                            Spacer(modifier = Modifier.height(24.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                OutlinedButton(onClick = onBack) { Text("Back") }
                                Button(onClick = { viewModel.onIntent(DashboardUiIntent.Connect) }) { Text("Reconnect") }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ConnectionStatusBadge(state: ConnectionState) {
    val (text, color) = when (state) {
        is ConnectionState.Connected -> "CONNECTED" to Color(0xFF4CAF50)
        is ConnectionState.Connecting -> "CONNECTING" to Color(0xFFFFC107)
        is ConnectionState.Disconnected -> "DISCONNECTED" to Color(0xFFF44336)
        is ConnectionState.Failed -> "ERROR" to Color(0xFFF44336)
        else -> "IDLE" to Color.Gray
    }
    
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(color))
        Spacer(modifier = Modifier.width(6.dp))
        Text(text = text, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = color)
    }
}

@Composable
fun TelemetryCard(label: String, value: String, icon: ImageVector, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier.height(100.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Column(
            modifier = Modifier.padding(12.dp).fillMaxSize(),
            verticalArrangement = Arrangement.Center
        ) {
            Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp))
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = label, fontSize = 11.sp, color = MaterialTheme.colorScheme.secondary)
            Text(text = value, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
        }
    }
}
