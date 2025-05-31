
export const validateLoginInput = (login: string, password: string) => {
  const errors: string[] = [];

  if (!login || login.trim() === "") {
    errors.push("Login is required");
  }

  if (!password || password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  return errors;
};

export const validateRegisterInput = (userData: {
  login: string;
  password: string;
  role: string;
  departmentId: string;
}) => {
  const errors: string[] = [];

  if (!userData.login || userData.login.trim() === "") {
    errors.push("Login is required");
  }

  if (!userData.password || userData.password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (!userData.role || !["ADMIN", "USER"].includes(userData.role)) {
    errors.push("Valid role is required (ADMIN or USER)");
  }

  if (!userData.departmentId || userData.departmentId.trim() === "") {
    errors.push("Department ID is required");
  }

  return errors;
};
