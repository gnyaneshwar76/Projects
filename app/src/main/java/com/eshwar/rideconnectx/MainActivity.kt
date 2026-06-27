package com.eshwar.rideconnectx

import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.navigation.compose.rememberNavController
import com.eshwar.rideconnectx.core.util.BlePermissionHandler
import com.eshwar.rideconnectx.presentation.navigation.NavGraph
import com.eshwar.rideconnectx.presentation.theme.RideConnectXTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    private var permissionsGranted by mutableStateOf(false)

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        permissionsGranted = permissions.entries.all { it.value }
    }

    private fun checkPermissions(): Boolean {
        return BlePermissionHandler.getRequiredPermissions().all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initial check
        permissionsGranted = checkPermissions()
        
        if (!permissionsGranted) {
            permissionLauncher.launch(BlePermissionHandler.getRequiredPermissions())
        }

        enableEdgeToEdge()
        setContent {
            RideConnectXTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    // This block will recompose when permissionsGranted changes
                    if (permissionsGranted) {
                        val navController = rememberNavController()
                        NavGraph(navController = navController)
                    } else {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(24.dp)) {
                                Text(
                                    "Permissions required to search and connect to scooters.",
                                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                                )
                                Spacer(modifier = Modifier.height(24.dp))
                                Button(onClick = { 
                                    permissionLauncher.launch(BlePermissionHandler.getRequiredPermissions()) 
                                }) {
                                    Text("Grant Permissions")
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
