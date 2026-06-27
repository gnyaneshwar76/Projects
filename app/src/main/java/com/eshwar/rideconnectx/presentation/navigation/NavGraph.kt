package com.eshwar.rideconnectx.presentation.navigation

import androidx.compose.runtime.*
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.eshwar.rideconnectx.data.local.SessionDataStore
import com.eshwar.rideconnectx.domain.repository.BleRepository
import com.eshwar.rideconnectx.domain.repository.ConnectionState
import com.eshwar.rideconnectx.presentation.screens.DashboardScreen
import com.eshwar.rideconnectx.presentation.screens.ScanScreen
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

@HiltViewModel
class StartupViewModel @Inject constructor(
    private val sessionDataStore: SessionDataStore,
    private val bleRepository: BleRepository
) : ViewModel() {
    val startDestination: StateFlow<String?> = sessionDataStore.lastDeviceAddress.map { address ->
        if (address != null) "dashboard/$address" else "scan"
    }.stateIn(
        viewModelScope,
        SharingStarted.Eagerly,
        null // Start with null to allow NavGraph to wait for the real value
    )
}

@Composable
fun NavGraph(
    navController: NavHostController,
    startupViewModel: StartupViewModel = hiltViewModel()
) {
    val startDest by startupViewModel.startDestination.collectAsState()

    // Wait for the DataStore to provide the initial destination to avoid the "scan" flicker
    // and prevent recomposition loops once the app is running.
    if (startDest == null) {
        // Optional: Show a splash or loading screen
        return
    }

    // We use remember to lock the startDestination to the first value received.
    // This prevents the NavHost from being recreated when a session is saved during runtime.
    val initialRoute = remember { startDest!! }

    NavHost(
        navController = navController,
        startDestination = initialRoute
    ) {
        composable("scan") {
            ScanScreen(
                onNavigateToDashboard = { address ->
                    navController.navigate("dashboard/$address") {
                        popUpTo("scan") { inclusive = false }
                    }
                }
            )
        }
        composable(
            route = "dashboard/{deviceAddress}",
            arguments = listOf(navArgument("deviceAddress") { type = NavType.StringType })
        ) {
            DashboardScreen(
                onBack = { 
                    navController.popBackStack("scan", inclusive = false)
                }
            )
        }
    }
}
