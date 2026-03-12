package ai.nanosolana.app.protocol

import org.junit.Assert.assertEquals
import org.junit.Test

class NanoSolanaProtocolConstantsTest {
  @Test
  fun canvasCommandsUseStableStrings() {
    assertEquals("canvas.present", NanoSolanaCanvasCommand.Present.rawValue)
    assertEquals("canvas.hide", NanoSolanaCanvasCommand.Hide.rawValue)
    assertEquals("canvas.navigate", NanoSolanaCanvasCommand.Navigate.rawValue)
    assertEquals("canvas.eval", NanoSolanaCanvasCommand.Eval.rawValue)
    assertEquals("canvas.snapshot", NanoSolanaCanvasCommand.Snapshot.rawValue)
  }

  @Test
  fun a2uiCommandsUseStableStrings() {
    assertEquals("canvas.a2ui.push", NanoSolanaCanvasA2UICommand.Push.rawValue)
    assertEquals("canvas.a2ui.pushJSONL", NanoSolanaCanvasA2UICommand.PushJSONL.rawValue)
    assertEquals("canvas.a2ui.reset", NanoSolanaCanvasA2UICommand.Reset.rawValue)
  }

  @Test
  fun capabilitiesUseStableStrings() {
    assertEquals("canvas", NanoSolanaCapability.Canvas.rawValue)
    assertEquals("camera", NanoSolanaCapability.Camera.rawValue)
    assertEquals("voiceWake", NanoSolanaCapability.VoiceWake.rawValue)
    assertEquals("location", NanoSolanaCapability.Location.rawValue)
    assertEquals("sms", NanoSolanaCapability.Sms.rawValue)
    assertEquals("device", NanoSolanaCapability.Device.rawValue)
    assertEquals("notifications", NanoSolanaCapability.Notifications.rawValue)
    assertEquals("system", NanoSolanaCapability.System.rawValue)
    assertEquals("photos", NanoSolanaCapability.Photos.rawValue)
    assertEquals("contacts", NanoSolanaCapability.Contacts.rawValue)
    assertEquals("calendar", NanoSolanaCapability.Calendar.rawValue)
    assertEquals("motion", NanoSolanaCapability.Motion.rawValue)
  }

  @Test
  fun cameraCommandsUseStableStrings() {
    assertEquals("camera.list", NanoSolanaCameraCommand.List.rawValue)
    assertEquals("camera.snap", NanoSolanaCameraCommand.Snap.rawValue)
    assertEquals("camera.clip", NanoSolanaCameraCommand.Clip.rawValue)
  }

  @Test
  fun notificationsCommandsUseStableStrings() {
    assertEquals("notifications.list", NanoSolanaNotificationsCommand.List.rawValue)
    assertEquals("notifications.actions", NanoSolanaNotificationsCommand.Actions.rawValue)
  }

  @Test
  fun deviceCommandsUseStableStrings() {
    assertEquals("device.status", NanoSolanaDeviceCommand.Status.rawValue)
    assertEquals("device.info", NanoSolanaDeviceCommand.Info.rawValue)
    assertEquals("device.permissions", NanoSolanaDeviceCommand.Permissions.rawValue)
    assertEquals("device.health", NanoSolanaDeviceCommand.Health.rawValue)
  }

  @Test
  fun systemCommandsUseStableStrings() {
    assertEquals("system.notify", NanoSolanaSystemCommand.Notify.rawValue)
  }

  @Test
  fun photosCommandsUseStableStrings() {
    assertEquals("photos.latest", NanoSolanaPhotosCommand.Latest.rawValue)
  }

  @Test
  fun contactsCommandsUseStableStrings() {
    assertEquals("contacts.search", NanoSolanaContactsCommand.Search.rawValue)
    assertEquals("contacts.add", NanoSolanaContactsCommand.Add.rawValue)
  }

  @Test
  fun calendarCommandsUseStableStrings() {
    assertEquals("calendar.events", NanoSolanaCalendarCommand.Events.rawValue)
    assertEquals("calendar.add", NanoSolanaCalendarCommand.Add.rawValue)
  }

  @Test
  fun motionCommandsUseStableStrings() {
    assertEquals("motion.activity", NanoSolanaMotionCommand.Activity.rawValue)
    assertEquals("motion.pedometer", NanoSolanaMotionCommand.Pedometer.rawValue)
  }
}
