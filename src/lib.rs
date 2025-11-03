#![deny(clippy::all)]

use napi_derive::napi;

#[napi]
pub fn get() -> Option<String> {
  rbx_cookie::get_value()
}
