package com.eshwar.rideconnectx.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.eshwar.rideconnectx.core.util.SystemStateManager
import com.eshwar.rideconnectx.domain.model.BleDevice
import com.eshwar.rideconnectx.domain.usecase.ScanDevicesUseCase
import com.eshwar.rideconnectx.domain.repository.ConnectionState
import com.eshwar.rideconnectx.data.local.SessionDataStore
import kotlinx.coroutines.flow.first
import com.eshwar.rideconnectx.presentation.mvi.UiEffect
import com.eshwar.rideconnectx.presentation.mvi.UiIntent
import com.eshwar.rideconnectx.presentation.mvi.UiState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ScanUiState(
    val devices: List<BleDevice> = emptyList(),
    val connectionState: ConnectionState = ConnectionState.Idle,
    val isBluetoothEnabled: Boolean = true,
    val isLocationEnabled: Boolean = true,
    val lastDeviceName: String? = null,
    val lastDeviceAddress: String? = null,
    val error: String? = null
) : UiState

sealed class ScanUiIntent : UiIntent {
    object StartScan : ScanUiIntent()
    object StopScan : ScanUiIntent()
    data class SelectDevice(val address: String) : ScanUiIntent()
}

sealed class ScanUiEffect : UiEffect {
    data class NavigateToDashboard(val address: String) : ScanUiEffect()
}

@HiltViewModel
class ScanViewModel @Inject constructor(
    private val scanDevicesUseCase: ScanDevicesUseCase,
    private val systemStateManager: SystemStateManager,
    private val sessionDataStore: SessionDataStore
) : ViewModel() {

    private val _uiState = MutableStateFlow(ScanUiState())
    val uiState = _uiState.asStateFlow()

    private val _effect = MutableSharedFlow<ScanUiEffect>()
    val effect = _effect.asSharedFlow()

    private var scanJob: Job? = null

    init {
        observeSystemState()
        loadLastSession()
    }

    private fun loadLastSession() {
        viewModelScope.launch {
            val address = sessionDataStore.lastDeviceAddress.first()
            val name = sessionDataStore.lastDeviceName.first()
            _uiState.update { it.copy(lastDeviceAddress = address, lastDeviceName = name) }
        }
    }

    private fun observeSystemState() {
        viewModelScope.launch {
            combine(
                systemStateManager.isBluetoothEnabled,
                systemStateManager.isLocationEnabled
            ) { bt, loc ->
                _uiState.update { it.copy(isBluetoothEnabled = bt, isLocationEnabled = loc) }
            }.collect()
        }
    }

    fun onIntent(intent: ScanUiIntent) {
        when (intent) {
            is ScanUiIntent.StartScan -> startScan()
            is ScanUiIntent.StopScan -> stopScan()
            is ScanUiIntent.SelectDevice -> {
                viewModelScope.launch {
                    _effect.emit(ScanUiEffect.NavigateToDashboard(intent.address))
                }
            }
        }
    }

    private fun startScan() {
        scanJob?.cancel()
        _uiState.update { it.copy(connectionState = ConnectionState.Scanning, devices = emptyList()) }
        scanJob = viewModelScope.launch {
            scanDevicesUseCase().collect { devices ->
                _uiState.update { it.copy(devices = devices) }
            }
            // If flow completes (timeout), state will be handled or kept as Idle
            _uiState.update { it.copy(connectionState = ConnectionState.Idle) }
        }
    }

    private fun stopScan() {
        scanJob?.cancel()
        _uiState.update { it.copy(connectionState = ConnectionState.Idle) }
    }
}
