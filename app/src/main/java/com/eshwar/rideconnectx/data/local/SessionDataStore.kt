package com.eshwar.rideconnectx.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "ride_session")

@Singleton
class SessionDataStore @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        private val LAST_DEVICE_ADDRESS = stringPreferencesKey("last_device_address")
        private val LAST_DEVICE_NAME = stringPreferencesKey("last_device_name")
        private val LAST_CONNECTED_TIMESTAMP = longPreferencesKey("last_connected_timestamp")
        private val IS_NAV_ACTIVE = booleanPreferencesKey("is_nav_active")
        private val NAV_DESTINATION = stringPreferencesKey("nav_destination")
    }

    val lastDeviceAddress: Flow<String?> = context.dataStore.data.map { it[LAST_DEVICE_ADDRESS] }
    val lastDeviceName: Flow<String?> = context.dataStore.data.map { it[LAST_DEVICE_NAME] }

    suspend fun saveSession(address: String, name: String) {
        context.dataStore.edit { preferences ->
            preferences[LAST_DEVICE_ADDRESS] = address
            preferences[LAST_DEVICE_NAME] = name
            preferences[LAST_CONNECTED_TIMESTAMP] = System.currentTimeMillis()
        }
    }

    suspend fun clearSession() {
        context.dataStore.edit { preferences ->
            preferences.remove(LAST_DEVICE_ADDRESS)
            preferences.remove(LAST_DEVICE_NAME)
            preferences.remove(LAST_CONNECTED_TIMESTAMP)
        }
    }
    
    suspend fun saveNavState(isActive: Boolean, destination: String? = null) {
        context.dataStore.edit { preferences ->
            preferences[IS_NAV_ACTIVE] = isActive
            destination?.let { preferences[NAV_DESTINATION] = it }
        }
    }
    
    val isNavActive: Flow<Boolean> = context.dataStore.data.map { it[IS_NAV_ACTIVE] ?: false }
    val navDestination: Flow<String?> = context.dataStore.data.map { it[NAV_DESTINATION] }
}
