package ai.nanosolana.app.ui

import androidx.compose.runtime.Composable
import ai.nanosolana.app.MainViewModel
import ai.nanosolana.app.ui.chat.ChatSheetContent

@Composable
fun ChatSheet(viewModel: MainViewModel) {
  ChatSheetContent(viewModel = viewModel)
}
