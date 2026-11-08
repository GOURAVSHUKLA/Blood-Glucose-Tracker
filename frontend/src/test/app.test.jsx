import { AuthProvider } from "../context/AuthContext.jsx";
import { apiRequest } from "../services/api.js";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Dashboard from "../pages/Dashboard.jsx";
import Login from "../pages/Login.jsx";
import Signup from "../pages/Signup.jsx";
import ReadingForm from "../components/ReadingForm.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import { storeAuthSession } from "../services/authSession.js";

vi.mock("../services/api.js", () => ({
  apiRequest: vi.fn(),
}));

function renderWithAuth(ui, { route = "/" } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
  );
}

function localDateValue() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.sessionStorage.clear();
});

describe("Login form", () => {
  it("shows validation errors and does not submit invalid values", async () => {
    const user = userEvent.setup();
    renderWithAuth(<Login />);

    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(screen.getByText("Email is required.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("submits valid credentials and stores the returned session", async () => {
    const user = userEvent.setup();
    apiRequest.mockResolvedValue({
      token: "test-token",
      user: { id: 1, name: "Alex Doe", email: "alex@example.com" },
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<p>Dashboard page</p>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Email"), "alex@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Dashboard page")).toBeInTheDocument();
    expect(apiRequest).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      data: { email: "alex@example.com", password: "password123" },
    });
    expect(window.sessionStorage.getItem("sweety.auth.token")).toBe("test-token");
    expect(JSON.parse(window.sessionStorage.getItem("sweety.auth.user"))).toMatchObject({
      name: "Alex Doe",
      email: "alex@example.com",
    });
  });
});

describe("Signup form", () => {
  it("validates the required fields and password confirmation", async () => {
    const user = userEvent.setup();
    renderWithAuth(<Signup />);

    await user.type(screen.getByLabelText("Full name"), "A");
    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.type(screen.getByLabelText("Confirm password"), "different");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByText("Full name must be at least 2 characters.")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText("Password must be at least 8 characters.")).toBeInTheDocument();
    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("submits valid details and shows confirmation", async () => {
    const user = userEvent.setup();
    apiRequest.mockResolvedValue({ message: "Your account was created." });
    renderWithAuth(<Signup />);

    await user.type(screen.getByLabelText("Full name"), "Alex Doe");
    await user.type(screen.getByLabelText("Email"), "alex@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Your account was created.");
    expect(apiRequest).toHaveBeenCalledWith("/auth/register", {
      method: "POST",
      data: { name: "Alex Doe", email: "alex@example.com", password: "password123" },
    });
  });
});

describe("Reading form", () => {
  it("shows required and range validation errors", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ReadingForm
          isLoadingReadings={false}
          loadError=""
          onReadingCreated={vi.fn()}
          readings={[]}
        />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Save reading" }));
    expect(screen.getByText("Choose a time slot.")).toBeInTheDocument();
    expect(screen.getByText("Glucose value is required.")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Time slot"), "morning");
    await user.type(screen.getByLabelText("Glucose value (mg/dL)"), "601");
    await user.click(screen.getByRole("button", { name: "Save reading" }));

    expect(screen.getByText("Value must be between 40 and 600 mg/dL.")).toBeInTheDocument();
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("creates a valid reading through the API", async () => {
    const user = userEvent.setup();
    const onReadingCreated = vi.fn();
    const reading = {
      id: 15,
      reading_date: localDateValue(),
      time_slot: "morning",
      value: 110,
    };
    apiRequest.mockResolvedValue({ message: "Reading saved successfully.", reading });

    render(
      <MemoryRouter>
        <ReadingForm
          isLoadingReadings={false}
          loadError=""
          onReadingCreated={onReadingCreated}
          readings={[]}
        />
      </MemoryRouter>,
    );

    await user.selectOptions(screen.getByLabelText("Time slot"), "morning");
    await user.type(screen.getByLabelText("Glucose value (mg/dL)"), "110");
    await user.click(screen.getByRole("button", { name: "Save reading" }));

    await waitFor(() => expect(onReadingCreated).toHaveBeenCalledWith(reading));
    expect(apiRequest).toHaveBeenCalledWith("/readings", {
      method: "POST",
      data: {
        reading_date: localDateValue(),
        time_slot: "morning",
        value: 110,
      },
    });
    expect(screen.getByText("Reading saved successfully.", { exact: true })).toBeInTheDocument();
  });
});

describe("Dashboard", () => {
  it("renders selected-day statistics and recent readings", async () => {
    apiRequest.mockResolvedValue([
      { id: 1, reading_date: localDateValue(), time_slot: "morning", value: 100 },
      { id: 2, reading_date: localDateValue(), time_slot: "after_breakfast", value: 140 },
    ]);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Today’s overview")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Glucose statistics" })).toBeInTheDocument();
    expect(screen.getAllByText("140", { exact: true })).toHaveLength(2);
    expect(screen.getAllByText("100", { exact: true })).toHaveLength(2);
    expect(screen.getByText("120.0")).toBeInTheDocument();
    expect(screen.getByText("Morning")).toBeInTheDocument();
    expect(screen.getByText("After Breakfast")).toBeInTheDocument();
  });
});

describe("Protected routes", () => {
  it("redirects unauthenticated users to login", async () => {
    render(
      <MemoryRouter initialEntries={["/private"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/private"
              element={<ProtectedRoute><p>Private content</p></ProtectedRoute>}
            />
            <Route path="/login" element={<p>Login page</p>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Private content")).not.toBeInTheDocument();
  });

  it("allows authenticated users to access protected content", async () => {
    storeAuthSession("test-token", { id: 1, name: "Alex Doe", email: "alex@example.com" });

    render(
      <MemoryRouter initialEntries={["/private"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/private"
              element={<ProtectedRoute><p>Private content</p></ProtectedRoute>}
            />
            <Route path="/login" element={<p>Login page</p>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Private content")).toBeInTheDocument();
    expect(screen.queryByText("Login page")).not.toBeInTheDocument();
  });
});
