package ai.nanosolana.app.node

import ai.nanosolana.app.protocol.NanoSolanaCalendarCommand
import ai.nanosolana.app.protocol.NanoSolanaCanvasA2UICommand
import ai.nanosolana.app.protocol.NanoSolanaCanvasCommand
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

data class NodeRuntimeFlags(
  val cameraEnabled: Boolean,
  val locationEnabled: Boolean,
  val smsAvailable: Boolean,
  val voiceWakeEnabled: Boolean,
  val motionActivityAvailable: Boolean,
  val motionPedometerAvailable: Boolean,
  val debugBuild: Boolean,
)

enum class InvokeCommandAvailability {
  Always,
  CameraEnabled,
  LocationEnabled,
  SmsAvailable,
  MotionActivityAvailable,
  MotionPedometerAvailable,
  DebugBuild,
}

enum class NodeCapabilityAvailability {
  Always,
  CameraEnabled,
  LocationEnabled,
  SmsAvailable,
  VoiceWakeEnabled,
  MotionAvailable,
}

data class NodeCapabilitySpec(
  val name: String,
  val availability: NodeCapabilityAvailability = NodeCapabilityAvailability.Always,
)

data class InvokeCommandSpec(
  val name: String,
  val requiresForeground: Boolean = false,
  val availability: InvokeCommandAvailability = InvokeCommandAvailability.Always,
)

object InvokeCommandRegistry {
  val capabilityManifest: List<NodeCapabilitySpec> =
    listOf(
      NodeCapabilitySpec(name = NanoSolanaCapability.Canvas.rawValue),
      NodeCapabilitySpec(name = NanoSolanaCapability.Device.rawValue),
      NodeCapabilitySpec(name = NanoSolanaCapability.Notifications.rawValue),
      NodeCapabilitySpec(name = NanoSolanaCapability.System.rawValue),
      NodeCapabilitySpec(
        name = NanoSolanaCapability.Camera.rawValue,
        availability = NodeCapabilityAvailability.CameraEnabled,
      ),
      NodeCapabilitySpec(
        name = NanoSolanaCapability.Sms.rawValue,
        availability = NodeCapabilityAvailability.SmsAvailable,
      ),
      NodeCapabilitySpec(
        name = NanoSolanaCapability.VoiceWake.rawValue,
        availability = NodeCapabilityAvailability.VoiceWakeEnabled,
      ),
      NodeCapabilitySpec(
        name = NanoSolanaCapability.Location.rawValue,
        availability = NodeCapabilityAvailability.LocationEnabled,
      ),
      NodeCapabilitySpec(name = NanoSolanaCapability.Photos.rawValue),
      NodeCapabilitySpec(name = NanoSolanaCapability.Contacts.rawValue),
      NodeCapabilitySpec(name = NanoSolanaCapability.Calendar.rawValue),
      NodeCapabilitySpec(
        name = NanoSolanaCapability.Motion.rawValue,
        availability = NodeCapabilityAvailability.MotionAvailable,
      ),
    )

  val all: List<InvokeCommandSpec> =
    listOf(
      InvokeCommandSpec(
        name = NanoSolanaCanvasCommand.Present.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = NanoSolanaCanvasCommand.Hide.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = NanoSolanaCanvasCommand.Navigate.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = NanoSolanaCanvasCommand.Eval.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = NanoSolanaCanvasCommand.Snapshot.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = NanoSolanaCanvasA2UICommand.Push.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = NanoSolanaCanvasA2UICommand.PushJSONL.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = NanoSolanaCanvasA2UICommand.Reset.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = NanoSolanaSystemCommand.Notify.rawValue,
      ),
      InvokeCommandSpec(
        name = NanoSolanaCameraCommand.List.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = NanoSolanaCameraCommand.Snap.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = NanoSolanaCameraCommand.Clip.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = NanoSolanaLocationCommand.Get.rawValue,
        availability = InvokeCommandAvailability.LocationEnabled,
      ),
      InvokeCommandSpec(
        name = NanoSolanaDeviceCommand.Status.rawValue,
      ),
      InvokeCommandSpec(
        name = NanoSolanaDeviceCommand.Info.rawValue,
      ),
      InvokeCommandSpec(
        name = NanoSolanaDeviceCommand.Permissions.rawValue,
      ),
      InvokeCommandSpec(
        name = NanoSolanaDeviceCommand.Health.rawValue,
      ),
      InvokeCommandSpec(
        name = NanoSolanaNotificationsCommand.List.rawValue,
      ),
      InvokeCommandSpec(
        name = NanoSolanaNotificationsCommand.Actions.rawValue,
      ),
      InvokeCommandSpec(
        name = NanoSolanaPhotosCommand.Latest.rawValue,
      ),
      InvokeCommandSpec(
        name = NanoSolanaContactsCommand.Search.rawValue,
      ),
      InvokeCommandSpec(
        name = NanoSolanaContactsCommand.Add.rawValue,
      ),
      InvokeCommandSpec(
        name = NanoSolanaCalendarCommand.Events.rawValue,
      ),
      InvokeCommandSpec(
        name = NanoSolanaCalendarCommand.Add.rawValue,
      ),
      InvokeCommandSpec(
        name = NanoSolanaMotionCommand.Activity.rawValue,
        availability = InvokeCommandAvailability.MotionActivityAvailable,
      ),
      InvokeCommandSpec(
        name = NanoSolanaMotionCommand.Pedometer.rawValue,
        availability = InvokeCommandAvailability.MotionPedometerAvailable,
      ),
      InvokeCommandSpec(
        name = NanoSolanaSmsCommand.Send.rawValue,
        availability = InvokeCommandAvailability.SmsAvailable,
      ),
      InvokeCommandSpec(
        name = "debug.logs",
        availability = InvokeCommandAvailability.DebugBuild,
      ),
      InvokeCommandSpec(
        name = "debug.ed25519",
        availability = InvokeCommandAvailability.DebugBuild,
      ),
    )

  private val byNameInternal: Map<String, InvokeCommandSpec> = all.associateBy { it.name }

  fun find(command: String): InvokeCommandSpec? = byNameInternal[command]

  fun advertisedCapabilities(flags: NodeRuntimeFlags): List<String> {
    return capabilityManifest
      .filter { spec ->
        when (spec.availability) {
          NodeCapabilityAvailability.Always -> true
          NodeCapabilityAvailability.CameraEnabled -> flags.cameraEnabled
          NodeCapabilityAvailability.LocationEnabled -> flags.locationEnabled
          NodeCapabilityAvailability.SmsAvailable -> flags.smsAvailable
          NodeCapabilityAvailability.VoiceWakeEnabled -> flags.voiceWakeEnabled
          NodeCapabilityAvailability.MotionAvailable -> flags.motionActivityAvailable || flags.motionPedometerAvailable
        }
      }
      .map { it.name }
  }

  fun advertisedCommands(flags: NodeRuntimeFlags): List<String> {
    return all
      .filter { spec ->
        when (spec.availability) {
          InvokeCommandAvailability.Always -> true
          InvokeCommandAvailability.CameraEnabled -> flags.cameraEnabled
          InvokeCommandAvailability.LocationEnabled -> flags.locationEnabled
          InvokeCommandAvailability.SmsAvailable -> flags.smsAvailable
          InvokeCommandAvailability.MotionActivityAvailable -> flags.motionActivityAvailable
          InvokeCommandAvailability.MotionPedometerAvailable -> flags.motionPedometerAvailable
          InvokeCommandAvailability.DebugBuild -> flags.debugBuild
        }
      }
      .map { it.name }
  }
}
