class ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  token?: string;

  constructor(success: boolean, message: string, data?: any, token?: string) {
    this.success = success;
    this.message = message;
    if (data !== undefined) this.data = data;
    if (token !== undefined) this.token = token;
  }

  static success(message: string, data?: any, token?: string) {
    return new ApiResponse(true, message, data, token);
  }

  static error(message: string, data?: any) {
    return new ApiResponse(false, message, data);
  }
}

export default ApiResponse;