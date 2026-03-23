#include <pebble.h>

static Window *s_window;
static TextLayer *s_title_layer;
static TextLayer *s_up_layer;
static TextLayer *s_select_layer;
static TextLayer *s_down_layer;
static TextLayer *s_status_layer;

static char s_up_text[64] = "\u2191  (not set)";
static char s_select_text[64] = "\u2192  (not set)";
static char s_down_text[64] = "\u2193  (not set)";
static char s_status_text[64] = "";

static void send_button_press(int index) {
  DictionaryIterator *iter;
  AppMessageResult result = app_message_outbox_begin(&iter);
  if (result != APP_MSG_OK) return;

  dict_write_int32(iter, MESSAGE_KEY_ButtonIndex, index);
  app_message_outbox_send();

  snprintf(s_status_text, sizeof(s_status_text), "Sending...");
  text_layer_set_text(s_status_layer, s_status_text);
}

static void up_click_handler(ClickRecognizerRef recognizer, void *context) {
  send_button_press(0);
}

static void select_click_handler(ClickRecognizerRef recognizer, void *context) {
  send_button_press(1);
}

static void down_click_handler(ClickRecognizerRef recognizer, void *context) {
  send_button_press(2);
}

static void click_config_provider(void *context) {
  window_single_click_subscribe(BUTTON_ID_UP, up_click_handler);
  window_single_click_subscribe(BUTTON_ID_SELECT, select_click_handler);
  window_single_click_subscribe(BUTTON_ID_DOWN, down_click_handler);
}

static void update_request_name(int index, const char *name) {
  char *buf;
  TextLayer *layer;
  const char *prefix;

  switch (index) {
    case 0: buf = s_up_text; layer = s_up_layer; prefix = "\u2191  "; break;
    case 1: buf = s_select_text; layer = s_select_layer; prefix = "\u2192  "; break;
    case 2: buf = s_down_text; layer = s_down_layer; prefix = "\u2193  "; break;
    default: return;
  }

  if (name && strlen(name) > 0) {
    snprintf(buf, 64, "%s%s", prefix, name);
  } else {
    snprintf(buf, 64, "%s(not set)", prefix);
  }
  text_layer_set_text(layer, buf);
}

static void inbox_received_handler(DictionaryIterator *iter, void *context) {
  // Handle request names from phone
  Tuple *name0 = dict_find(iter, MESSAGE_KEY_RequestName0);
  if (name0) update_request_name(0, name0->value->cstring);

  Tuple *name1 = dict_find(iter, MESSAGE_KEY_RequestName1);
  if (name1) update_request_name(1, name1->value->cstring);

  Tuple *name2 = dict_find(iter, MESSAGE_KEY_RequestName2);
  if (name2) update_request_name(2, name2->value->cstring);

  // Handle response status
  Tuple *success = dict_find(iter, MESSAGE_KEY_ResponseSuccess);
  Tuple *status = dict_find(iter, MESSAGE_KEY_ResponseStatus);
  if (success && status) {
    if (success->value->int32) {
      snprintf(s_status_text, sizeof(s_status_text), "OK (%d)", (int)status->value->int32);
      vibes_short_pulse();
    } else {
      snprintf(s_status_text, sizeof(s_status_text), "Failed (%d)", (int)status->value->int32);
      vibes_double_pulse();
    }
    text_layer_set_text(s_status_layer, s_status_text);
  }
}

static void inbox_dropped_handler(AppMessageResult reason, void *context) {
  snprintf(s_status_text, sizeof(s_status_text), "Msg dropped");
  text_layer_set_text(s_status_layer, s_status_text);
}

static void outbox_failed_handler(DictionaryIterator *iter, AppMessageResult reason, void *context) {
  snprintf(s_status_text, sizeof(s_status_text), "Send failed");
  text_layer_set_text(s_status_layer, s_status_text);
}

static TextLayer *create_text_layer(GRect bounds, GFont font, GTextAlignment align) {
  TextLayer *layer = text_layer_create(bounds);
  text_layer_set_background_color(layer, GColorClear);
  text_layer_set_text_color(layer, GColorWhite);
  text_layer_set_font(layer, font);
  text_layer_set_text_alignment(layer, align);
  return layer;
}

static void window_load(Window *window) {
  Layer *root = window_get_root_layer(window);
  GRect bounds = layer_get_bounds(root);
  int w = bounds.size.w;

  GFont title_font = fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD);
  GFont body_font = fonts_get_system_font(FONT_KEY_GOTHIC_24);
  GFont status_font = fonts_get_system_font(FONT_KEY_GOTHIC_18);

  int y_start = PBL_IF_ROUND_ELSE(16, 4);
  int row_h = 30;
  int pad = PBL_IF_ROUND_ELSE(30, 8);

  // Title
  s_title_layer = create_text_layer(GRect(0, y_start, w, 28), title_font, GTextAlignmentCenter);
  text_layer_set_text(s_title_layer, "Pebble Fetch");
  layer_add_child(root, text_layer_get_layer(s_title_layer));

  // Request rows
  int row_y = y_start + 34;
  s_up_layer = create_text_layer(GRect(pad, row_y, w - pad * 2, row_h), body_font, GTextAlignmentLeft);
  text_layer_set_text(s_up_layer, s_up_text);
  layer_add_child(root, text_layer_get_layer(s_up_layer));

  s_select_layer = create_text_layer(GRect(pad, row_y + row_h, w - pad * 2, row_h), body_font, GTextAlignmentLeft);
  text_layer_set_text(s_select_layer, s_select_text);
  layer_add_child(root, text_layer_get_layer(s_select_layer));

  s_down_layer = create_text_layer(GRect(pad, row_y + row_h * 2, w - pad * 2, row_h), body_font, GTextAlignmentLeft);
  text_layer_set_text(s_down_layer, s_down_text);
  layer_add_child(root, text_layer_get_layer(s_down_layer));

  // Status bar
  s_status_layer = create_text_layer(GRect(pad, row_y + row_h * 3 + 4, w - pad * 2, 22), status_font, GTextAlignmentCenter);
  text_layer_set_text(s_status_layer, s_status_text);
  layer_add_child(root, text_layer_get_layer(s_status_layer));
}

static void window_unload(Window *window) {
  text_layer_destroy(s_title_layer);
  text_layer_destroy(s_up_layer);
  text_layer_destroy(s_select_layer);
  text_layer_destroy(s_down_layer);
  text_layer_destroy(s_status_layer);
}

static void init(void) {
  // Register AppMessage handlers
  app_message_register_inbox_received(inbox_received_handler);
  app_message_register_inbox_dropped(inbox_dropped_handler);
  app_message_register_outbox_failed(outbox_failed_handler);
  app_message_open(256, 256);

  // Create window
  s_window = window_create();
  window_set_background_color(s_window, GColorBlack);
  window_set_click_config_provider(s_window, click_config_provider);
  window_set_window_handlers(s_window, (WindowHandlers) {
    .load = window_load,
    .unload = window_unload,
  });
  window_stack_push(s_window, true);
}

static void deinit(void) {
  window_destroy(s_window);
}

int main(void) {
  init();
  app_event_loop();
  deinit();
}
