package ai.nanosolana.app.node

import ai.nanosolana.app.protocol.NanoSolanaCalendarCommand
import ai.nanosolana.app.protocol.NanoSolanaCameraCommand
import ai.nanosolana.app.protocol.NanoSolanaCapability
import ai.nanosolana.app.protocol.NanoSolanaContactsCommand
import ai.nanosolana.app.protocol.NanoSolanaDeviceCommand
import ai.nanosolana.app.protocol.NanoSolanaLocationCommand
import ai.nanosolana.app.protocol.NanoSolanaMotionCommand
import ai.nanosolana.app.protocol.NanoSolanaNotificationsCommand
import ai.nanosolana.app.protocol.NanoSolanaPhotosCommand
import ai.nanosolana.app.protocol.NanoSolanaSmsCommand
import ai.nanosolana.app.protocol.NanoSolanaSystemCommand
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class InvokeCommandRegistryTest {
  private val coreCapabilities =
    setOf(
      NanoSolanaCapability.Canvas.rawValue,
      NanoSolanaCapability.Device.rawValue,
      NanoSolanaCapability.Notifications.rawValue,
      NanoSolanaCapability.System.rawValue,
      NanoSolanaCapability.Photos.rawValue,
      NanoSolanaCapability.Contacts.rawValue,
      NanoSolanaCapability.Calendar.rawValue,
    )

  private val optionalCapabilities =
    setOf(
      NanoSolanaCapability.Camera.rawValue,
      NanoSolanaCapability.Location.rawValue,
      NanoSolanaCapability.Sms.rawValue,
      NanoSolanaCapability.VoiceWake.rawValue,
      NanoSolanaCapability.Motion.rawValue,
    )

  private val coreCommands =
    setOf(
      NanoSolanaDeviceCommand.Status.rawValue,
      NanoSolanaDeviceCommand.Info.rawValue,
      NanoSolanaDeviceCommand.Permissions.rawValue,
      NanoSolanaDeviceCommand.Health.rawValue,
      NanoSolanaNotificationsCommand.List.rawValue,
      NanoSolanaNotificationsCommand.Actions.rawValue,
      NanoSolanaSystemCommand.Notify.rawValue,
      NanoSolanaPhotosCommand.Latest.rawValue,
      NanoSolanaContactsCommand.Search.rawValue,
      NanoSolanaContactsCommand.Add.rawValue,
      NanoSolanaCalendarCommand.Events.rawValue,
      NanoSolanaCalendarCommand.Add.rawValue,
    )

  private val optionalCommands =
    setOf(
      NanoSolanaCameraCommand.Snap.rawValue,
      NanoSolanaCameraCommand.Clip.rawValue,
      NanoSolanaCameraCommand.List.rawValue,
      NanoSolanaLocationCommand.Get.rawValue,
      NanoSolanaMotionCommand.Activity.rawValue,
      NanoSolanaMotionCommand.Pedometer.rawValue,
      NanoSolanaSmsCommand.Send.rawValue,
    )

  private val debugCommands = setOf("debug.logs", "debug.ed25519")

  @Test
  fun advertisedCapabilities_respectsFeatureAvailability() {
    val capabilities = InvokeCommandRegistry.advertisedCapabilities(defaultFlags())

    assertContainsAll(capabilities, coreCapabilities)
    assertMissingAll(capabilities, optionalCapabilities)
  }

  @Test
  fun advertisedCapabilities_includesFeatureCapabilitiesWhenEnabled() {
    val capabilities =
      InvokeCommandRegistry.advertisedCapabilities(
        defaultFlags(
          cameraEnabled = true,
          locationEnabled = true,
          smsAvailable = true,
          voiceWakeEnabled = true,
          motionActivityAvailable = true,
          motionPedometerAvailable = true,
        ),
      )

    assertContainsAll(capabilities, coreCapabilities + optionalCapabilities)
  }

  @Test
  fun advertisedCommands_respectsFeatureAvailability() {
    val commands = InvokeCommandRegistry.advertisedCommands(defaultFlags())

    assertContainsAll(commands, coreCommands)
    assertMissingAll(commands, optionalCommands + debugCommands)
  }

  @Test
  fun advertisedCommands_includesFeatureCommandsWhenEnabled() {
    val commands =
      InvokeCommandRegistry.advertisedCommands(
        defaultFlags(
          cameraEnabled = true,
          locationEnabled = true,
          smsAvailable = true,
          motionActivityAvailable = true,
          motionPedometerAvailable = true,
          debugBuild = true,
        ),
      )

    assertContainsAll(commands, coreCommands + optionalCommands + debugCommands)
  }

  @Test
  fun advertisedCommands_onlyIncludesSupportedMotionCommands() {
    val commands =
      InvokeCommandRegistry.advertisedCommands(
        NodeRuntimeFlags(
          cameraEnabled = false,
          locationEnabled = false,
          smsAvailable = false,
          voiceWakeEnabled = false,
          motionActivityAvailable = true,
          motionPedometerAvailable = false,
          debugBuild = false,
        ),
      )

    assertTrue(commands.contains(NanoSolanaMotionCommand.Activity.rawValue))
    assertFalse(commands.contains(NanoSolanaMotionCommand.Pedometer.rawValue))
  }

  private fun defaultFlags(
    cameraEnabled: Boolean = false,
    locationEnabled: Boolean = false,
    smsAvailable: Boolean = false,
    voiceWakeEnabled: Boolean = false,
    motionActivityAvailable: Boolean = false,
    motionPedometerAvailable: Boolean = false,
    debugBuild: Boolean = false,
  ): NodeRuntimeFlags =
    NodeRuntimeFlags(
      cameraEnabled = cameraEnabled,
      locationEnabled = locationEnabled,
      smsAvailable = smsAvailable,
      voiceWakeEnabled = voiceWakeEnabled,
      motionActivityAvailable = motionActivityAvailable,
      motionPedometerAvailable = motionPedometerAvailable,
      debugBuild = debugBuild,
    )

  private fun assertContainsAll(actual: List<String>, expected: Set<String>) {
    expected.forEach { value -> assertTrue(actual.contains(value)) }
  }

  private fun assertMissingAll(actual: List<String>, forbidden: Set<String>) {
    forbidden.forEach { value -> assertFalse(actual.contains(value)) }
  }
}
