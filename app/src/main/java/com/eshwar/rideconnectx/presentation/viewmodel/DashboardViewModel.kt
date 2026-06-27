package com.eshwar.rideconnectx.presentation.viewmodel

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.eshwar.rideconnectx.domain.repository.BleRepository
import com.eshwar.rideconnectx.domain.usecase.ConnectToDeviceUseCase
import com.eshwar.rideconnectx.domain.repository.ConnectionState
import com.eshwar.rideconnectx.presentation.mvi.UiEffect
import com.eshwar.rideconnectx.presentation.mvi.UiIntent
import com.eshwar.rideconnectx.presentation.mvi.UiState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject
import android.util.Log

data class DashboardUiState(
    val connectionState: ConnectionState = ConnectionState.Idle,
    val deviceAddress: String? = null,
    val deviceName: String = "Suzuki Scooter",
    val speed: Int? = null,
    val battery: Int? = null,
    val fuel: Int? = null,
    val odometer: Int? = null
) : UiState

sealed class DashboardUiIntent : UiIntent {
    object Connect : DashboardUiIntent()
    object Disconnect : DashboardUiIntent()
}

sealed class DashboardUiEffect : UiEffect {
    data class ShowError(val message: String) : DashboardUiEffect()
}

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val connectToDeviceUseCase: ConnectToDeviceUseCase,
    private val bleRepository: BleRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {
    private val TAG = "RCX-BLE"
    private val deviceAddress: String? = savedStateHandle["deviceAddress"]

    private val _uiState = MutableStateFlow(DashboardUiState(deviceAddress = deviceAddress))
    val uiState = _uiState.asStateFlow()

    private val _effect = MutableSharedFlow<DashboardUiEffect>()
    val effect = _effect.asSharedFlow()

    init {
        deviceAddress?.let {
            onIntent(DashboardUiIntent.Connect)
        }
        observeTelemetry()
    }

    fun onIntent(intent: DashboardUiIntent) {
        when (intent) {
            is DashboardUiIntent.Connect -> connect()
            is DashboardUiIntent.Disconnect -> disconnect()
        }
    }

    private fun connect() {
        val address = deviceAddress ?: return
        viewModelScope.launch {
            connectToDeviceUseCase(address).collect { state ->
                Log.d(TAG, "Connection state emitted: ${state::class.simpleName}")
                _uiState.update { it.copy(connectionState = state) }
            }
        }
    }

    private fun observeTelemetry() {
        viewModelScope.launch {
            bleRepository.observeNotifications().collect { packet ->
                Log.d(TAG, "Notification received: ${packet.characteristicUuid}")
                // Real parsing deferred to Phase 4
            }
        }
    }

    private fun disconnect() {
        Log.d(TAG, "User disconnect requested from ViewModel")
        bleRepository.disconnect()
    }
}
