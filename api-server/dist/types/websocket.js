// Error Codes
export var SocketErrorCode;
(function (SocketErrorCode) {
  SocketErrorCode["AUTHENTICATION_REQUIRED"] = "AUTHENTICATION_REQUIRED";
  SocketErrorCode["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
  SocketErrorCode["TOKEN_INVALID"] = "TOKEN_INVALID";
  SocketErrorCode["CONTRACTOR_NOT_FOUND"] = "CONTRACTOR_NOT_FOUND";
  SocketErrorCode["CONTRACTOR_INACTIVE"] = "CONTRACTOR_INACTIVE";
  SocketErrorCode["CONTRACTOR_NOT_VERIFIED"] = "CONTRACTOR_NOT_VERIFIED";
  SocketErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
  SocketErrorCode["INVALID_LOCATION"] = "INVALID_LOCATION";
  SocketErrorCode["LOCATION_UPDATE_FAILED"] = "LOCATION_UPDATE_FAILED";
  SocketErrorCode["SUBSCRIPTION_FAILED"] = "SUBSCRIPTION_FAILED";
})(SocketErrorCode || (SocketErrorCode = {}));
//# sourceMappingURL=websocket.js.map
