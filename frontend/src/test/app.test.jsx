import { AuthProvider } from "../context/AuthContext.jsx";
import { apiRequest } from "../services/api.js";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Dashboard from "../pages/Dashboard.jsx";
import Login from "../pages/Login.jsx";
import Profile from "../pages/Profile.jsx";
import Readings from "../pages/Readings.jsx";
import Reports from "../pages/Reports.jsx";
import Signup from "../pages/Signup.jsx";
import ReadingForm from "../components/ReadingForm.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import { storeAuthSession } from "../services/authSession.js";

vi.mock("../services/api.js", () => ({
  apiRequest: vi.fn(),
}));

vi.mock("recharts", () => {
  const Chart = ({ children }) => <div>{children}</div>;
  const ChartElement = () => null;
  return {
    Bar: ChartElement,
    BarChart: Chart,
    CartesianGrid: ChartElement,
    Legend: ChartElement,
    Line: ChartElement,
    LineChart: Chart,
    ResponsiveContainer: Chart,
    Tooltip: ChartElement,
    XAxis: ChartElement,
    YAxis: ChartElement,
  };
});

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
  vi.restoreAllMocks();
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

  it("shows a clear error when credentials are rejected", async () => {
    const user = userEvent.setup();
    apiRequest.mockRejectedValue({
      response: { status: 401, data: { error: "Invalid email or password" } },
    });
    renderWithAuth(<Login />);

    await user.type(screen.getByLabelText("Email"), "alex@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password.");
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

describe("Reading management", () => {
  it("shows ten readings per page and supports moving between pages", async () => {
    const user = userEvent.setup();
    const readings = Array.from({ length: 21 }, (_, index) => ({
      id: index + 1,
      reading_date: `2025-06-${String(21 - index).padStart(2, "0")}`,
      time_slot: "morning",
      value: 100 + index,
      created_at: "2025-06-15T08:00:00Z",
    }));
    apiRequest.mockResolvedValue(readings);

    render(<Readings />);

    const table = await screen.findByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(11);
    expect(screen.getByText("Showing 1-10 of 21")).toBeInTheDocument();
    expect(screen.queryByText("110", { exact: true })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(within(table).getAllByRole("row")).toHaveLength(11);
    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
    expect(screen.getByText("Showing 11-20 of 21")).toBeInTheDocument();
    expect(screen.getByText("110", { exact: true })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(within(table).getAllByRole("row")).toHaveLength(2);
    expect(screen.getByText("Page 3 of 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
  });

  it("updates a reading and reflects the saved value", async () => {
    const user = userEvent.setup();
    const reading = {
      id: 21,
      reading_date: "2025-06-15",
      time_slot: "morning",
      value: 100,
      created_at: "2025-06-15T08:00:00Z",
    };
    const updatedReading = { ...reading, value: 125 };
    apiRequest
      .mockResolvedValueOnce([reading])
      .mockResolvedValueOnce({ message: "Reading updated successfully.", reading: updatedReading });
    Element.prototype.scrollIntoView = vi.fn();

    render(<Readings />);

    await user.click(await screen.findByRole("button", { name: /Edit reading/ }));
    const valueInput = screen.getByLabelText("Glucose value (mg/dL)");
    await user.clear(valueInput);
    await user.type(valueInput, "125");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Reading updated successfully.")).toBeInTheDocument();
    expect(screen.getByText("125", { exact: true })).toBeInTheDocument();
    expect(apiRequest).toHaveBeenLastCalledWith("/readings/21", {
      method: "PUT",
      data: {
        reading_date: "2025-06-15",
        time_slot: "morning",
        value: 125,
      },
    });
  });

  it("confirms deletion, removes the reading, and reports success", async () => {
    const user = userEvent.setup();
    const reading = {
      id: 22,
      reading_date: "2025-06-15",
      time_slot: "morning",
      value: 100,
      created_at: "2025-06-15T08:00:00Z",
    };
    apiRequest
      .mockResolvedValueOnce([reading])
      .mockResolvedValueOnce({ message: "Reading deleted successfully." });
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<Readings />);

    await user.click(await screen.findByRole("button", { name: /Delete reading/ }));

    expect(window.confirm).toHaveBeenCalledOnce();
    expect(await screen.findByText("Reading deleted successfully.")).toBeInTheDocument();
    expect(screen.queryByText("100", { exact: true })).not.toBeInTheDocument();
    expect(apiRequest).toHaveBeenLastCalledWith("/readings/22", { method: "DELETE" });
  });
});

describe("Reports and charts", () => {
  it("renders daily and month-to-date metrics with all chart sections", async () => {
    const date = localDateValue();
    const monthStart = `${date.slice(0, 7)}-01`;
    apiRequest.mockResolvedValue({
      date,
      totalReadings: 1,
      minValue: 110,
      maxValue: 110,
      averageValue: 110,
      readings: [{ id: 1, reading_date: date, time_slot: "morning", value: 110 }],
      monthToDate: {
        startDate: monthStart,
        endDate: date,
        totalReadings: 1,
        minValue: 110,
        maxValue: 110,
        averageValue: 110,
        dailyReadings: [{
          date,
          totalReadings: 1,
          minValue: 110,
          maxValue: 110,
          averageValue: 110,
        }],
      },
      previousMonth: {
        startDate: "2025-05-01",
        endDate: "2025-05-31",
        totalReadings: 0,
        minValue: null,
        maxValue: null,
        averageValue: null,
      },
    });

    render(<Reports />);

    expect(await screen.findByText("Glucose reports")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Monthly glucose" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Selected-day glucose" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Reading trend" })).toBeInTheDocument();
    expect(screen.getAllByText("Total readings", { exact: true })).toHaveLength(2);
    expect(apiRequest).toHaveBeenCalledWith("/reports", { params: { date } });
  });

  it("shows a clear report error and retry action", async () => {
    apiRequest.mockRejectedValueOnce(new Error("Report service unavailable."));
    render(<Reports />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Report service unavailable.");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
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

  it("logs out, clears stored credentials, and redirects to login", async () => {
    const user = userEvent.setup();
    storeAuthSession("test-token", { id: 1, name: "Alex Doe", email: "alex@example.com" });

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/profile"
              element={<ProtectedRoute><Profile /></ProtectedRoute>}
            />
            <Route path="/login" element={<p>Login page</p>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText("Alex Doe")).toBeInTheDocument();
    expect(screen.getByText("alex@example.com")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Log out" }));

    expect(await screen.findByText("Login page")).toBeInTheDocument();
    expect(window.sessionStorage.getItem("sweety.auth.token")).toBeNull();
    expect(window.sessionStorage.getItem("sweety.auth.user")).toBeNull();
  });
});
