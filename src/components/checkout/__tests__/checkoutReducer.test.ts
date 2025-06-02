import { checkoutReducer, initialState } from "../utils/checkoutReducer";
import { calculatePrices } from "../utils/priceCalculation";

describe("checkoutReducer", () => {
  it("should initialize with the correct state", () => {
    expect(initialState).toHaveProperty("contactId", undefined);
    expect(initialState).toHaveProperty("orderStatus", "Pending");
    expect(initialState).toHaveProperty("paypalTransactions", []);
    expect(initialState).toHaveProperty("depositAmount", 0);
    expect(initialState).toHaveProperty("balanceDue", 0);
    expect(initialState).toHaveProperty("tasks", []);
    expect(initialState).toHaveProperty("paymentMethod", "paypal");
  });

  it("should handle SET_CONTACT_ID action", () => {
    const contactId = "123456789";
    const action = { type: "SET_CONTACT_ID" as const, payload: contactId };
    const newState = checkoutReducer(initialState, action);
    expect(newState.contactId).toBe(contactId);
  });

  it("should handle SET_ORDER_STATUS action", () => {
    const orderStatus = "Paid" as const;
    const action = { type: "SET_ORDER_STATUS" as const, payload: orderStatus };
    const newState = checkoutReducer(initialState, action);
    expect(newState.orderStatus).toBe(orderStatus);
  });

  it("should handle ADD_PAYPAL_TRANSACTION action", () => {
    const transaction = {
      transactionId: "TX123456",
      payerId: "PAYER123",
      payerEmail: "test@example.com",
      amount: 100,
      currency: "USD" as const,
      status: "COMPLETED" as const,
      createdAt: new Date(),
    };
    const action = {
      type: "ADD_PAYPAL_TRANSACTION" as const,
      payload: transaction,
    };
    const newState = checkoutReducer(initialState, action);
    expect(newState.paypalTransactions).toHaveLength(1);
    expect(newState.paypalTransactions[0]).toEqual(transaction);
  });

  it("should handle SET_DEPOSIT_AMOUNT action", () => {
    const depositAmount = 50;
    const totalAmount = 100;
    const state = { ...initialState, totalAmount };
    const action = {
      type: "SET_DEPOSIT_AMOUNT" as const,
      payload: depositAmount,
    };
    const newState = checkoutReducer(state, action);
    expect(newState.depositAmount).toBe(depositAmount);
    expect(newState.balanceDue).toBe(totalAmount - depositAmount);
  });

  it("should handle UPDATE_BALANCE_DUE action", () => {
    const depositAmount = 50;
    const totalAmount = 100;
    const state = { ...initialState, depositAmount, totalAmount };
    const action = { type: "UPDATE_BALANCE_DUE" as const };
    const newState = checkoutReducer(state, action);
    expect(newState.balanceDue).toBe(totalAmount - depositAmount);
  });

  it("should handle ADD_TASK action", () => {
    const task = "Delivery";
    const action = { type: "ADD_TASK" as const, payload: task };
    const newState = checkoutReducer(initialState, action);
    expect(newState.tasks).toHaveLength(1);
    expect(newState.tasks[0]).toBe(task);
  });

  it("should handle REMOVE_TASK action", () => {
    const task = "Delivery";
    const state = { ...initialState, tasks: [task] };
    const action = { type: "REMOVE_TASK" as const, payload: task };
    const newState = checkoutReducer(state, action);
    expect(newState.tasks).toHaveLength(0);
  });

  it("should handle SET_PAYMENT_METHOD action", () => {
    const paymentMethod = "cash" as const;
    const action = {
      type: "SET_PAYMENT_METHOD" as const,
      payload: paymentMethod,
    };
    const newState = checkoutReducer(initialState, action);
    expect(newState.paymentMethod).toBe(paymentMethod);
  });

  it("should update orderStatus to Paid on PAYMENT_SUCCESS", () => {
    const action = { type: "PAYMENT_SUCCESS" as const };
    const newState = checkoutReducer(initialState, action);
    expect(newState.paymentStatus).toBe("Paid");
    expect(newState.orderStatus).toBe("Paid");
    expect(newState.paymentComplete).toBe(true);
  });
});

describe("calculatePrices", () => {
  it("should calculate balance due based on deposit amount", () => {
    const state = {
      ...initialState,
      bouncerPrice: 150,
      extras: [],
      depositAmount: 50,
    };

    const prices = calculatePrices(state);

    expect(prices.totalAmount).toBeGreaterThanOrEqual(0);
    expect(prices.depositAmount).toBe(50);
    expect(prices.balanceDue).toBe(prices.totalAmount - 50);
  });
});
