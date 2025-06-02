import { checkoutReducer, initialState } from "../utils/checkoutReducer";
import { calculatePrices } from "../utils/priceCalculation";
import { SLUSHY_MIXERS, SlushyMixer } from "../utils/types";

describe("Slushy Mixer Selection", () => {
  // Test the reducer actions for slushy mixer selection
  describe("Checkout Reducer", () => {
    it("should add a slushy mixer when SELECT_SLUSHY_MIXER action is dispatched", () => {
      const mixer = SLUSHY_MIXERS[1]; // Grape Kool Aid
      const action: { type: "SELECT_SLUSHY_MIXER"; payload: SlushyMixer } = {
        type: "SELECT_SLUSHY_MIXER",
        payload: {
          machineId: "slushyMachineSingle",
          tankNumber: 1,
          mixerId: mixer.id,
          name: mixer.name,
          price: mixer.price,
        },
      };

      const newState = checkoutReducer(
        { ...initialState, slushyMixers: [] },
        action,
      );

      expect(newState.slushyMixers).toHaveLength(1);
      expect(newState.slushyMixers[0]).toEqual({
        machineId: "slushyMachineSingle",
        tankNumber: 1,
        mixerId: mixer.id,
        name: mixer.name,
        price: mixer.price,
      });
    });

    it("should update an existing mixer when SELECT_SLUSHY_MIXER is dispatched for the same tank", () => {
      const initialMixer = SLUSHY_MIXERS[1]; // Grape Kool Aid
      const newMixer = SLUSHY_MIXERS[2]; // Cherry Kool Aid

      const initialStateWithMixer = {
        ...initialState,
        slushyMixers: [
          {
            machineId: "slushyMachineSingle",
            tankNumber: 1,
            mixerId: initialMixer.id,
            name: initialMixer.name,
            price: initialMixer.price,
          },
        ],
      };

      const action: { type: "SELECT_SLUSHY_MIXER"; payload: SlushyMixer } = {
        type: "SELECT_SLUSHY_MIXER",
        payload: {
          machineId: "slushyMachineSingle",
          tankNumber: 1,
          mixerId: newMixer.id,
          name: newMixer.name,
          price: newMixer.price,
        },
      };

      const newState = checkoutReducer(initialStateWithMixer, action);

      expect(newState.slushyMixers).toHaveLength(1);
      expect(newState.slushyMixers[0]).toEqual({
        machineId: "slushyMachineSingle",
        tankNumber: 1,
        mixerId: newMixer.id,
        name: newMixer.name,
        price: newMixer.price,
      });
    });

    it("should clear all slushy mixers when CLEAR_SLUSHY_MIXERS action is dispatched", () => {
      const stateWithMixers = {
        ...initialState,
        slushyMixers: [
          {
            machineId: "slushyMachineSingle",
            tankNumber: 1,
            mixerId: "grape",
            name: "Grape Kool Aid",
            price: 19.95,
          },
          {
            machineId: "slushyMachineSingle",
            tankNumber: 2,
            mixerId: "cherry",
            name: "Cherry Kool Aid",
            price: 19.95,
          },
        ],
      };

      const action: { type: "CLEAR_SLUSHY_MIXERS" } = {
        type: "CLEAR_SLUSHY_MIXERS",
      };
      const newState = checkoutReducer(stateWithMixers, action);

      expect(newState.slushyMixers).toHaveLength(0);
    });

    it("should clear slushy mixers when a slushy machine is deselected", () => {
      // Setup state with selected slushy machine and mixers
      const stateWithSlushyMachine = {
        ...initialState,
        extras: [
          ...initialState.extras.map((extra) =>
            extra.id === "slushyMachineSingle"
              ? { ...extra, selected: true }
              : extra,
          ),
        ],
        slushyMixers: [
          {
            machineId: "slushyMachineSingle",
            tankNumber: 1,
            mixerId: "grape",
            name: "Grape Kool Aid",
            price: 19.95,
          },
        ],
      };

      // Deselect the slushy machine
      const action: { type: "TOGGLE_EXTRA"; payload: string } = {
        type: "TOGGLE_EXTRA",
        payload: "slushyMachineSingle",
      };

      const newState = checkoutReducer(stateWithSlushyMachine, action);

      // Verify the slushy machine is deselected and mixers are cleared
      expect(
        newState.extras.find((e) => e.id === "slushyMachineSingle")?.selected,
      ).toBe(false);
      expect(newState.slushyMixers).toHaveLength(0);
    });
  });

  // Test the price calculation with slushy mixers
  describe("Price Calculation", () => {
    it("should include mixer prices in the total", () => {
      const stateWithMixers = {
        ...initialState,
        extras: [
          ...initialState.extras.map((extra) =>
            extra.id === "slushyMachineSingle"
              ? { ...extra, selected: true }
              : extra,
          ),
        ],
        slushyMixers: [
          {
            machineId: "slushyMachineSingle",
            tankNumber: 1,
            mixerId: "grape",
            name: "Grape Kool Aid",
            price: 19.95,
          },
        ],
      };

      const prices = calculatePrices(stateWithMixers);

      // The subtotal should include the slushy machine price (124.95) and the mixer price (19.95)
      const expectedSubtotal = 124.95 + 19.95 + 0; // Machine + Mixer + Delivery Fee (FREE)
      expect(prices.subtotal).toBeCloseTo(expectedSubtotal, 2);
    });

    it("should calculate correct total with multiple mixers", () => {
      const stateWithMultipleMixers = {
        ...initialState,
        extras: [
          ...initialState.extras.map((extra) =>
            extra.id === "slushyMachineDouble"
              ? { ...extra, selected: true }
              : extra,
          ),
        ],
        slushyMixers: [
          {
            machineId: "slushyMachineDouble",
            tankNumber: 1,
            mixerId: "grape",
            name: "Grape Kool Aid",
            price: 19.95,
          },
          {
            machineId: "slushyMachineDouble",
            tankNumber: 2,
            mixerId: "strawberry",
            name: "Strawberry Daiquiri",
            price: 24.95,
          },
        ],
      };

      const prices = calculatePrices(stateWithMultipleMixers);

      // The subtotal should include the double slushy machine price (149.95) and both mixer prices (19.95 + 24.95)
      const expectedSubtotal = 149.95 + 19.95 + 24.95 + 0; // Machine + Mixer1 + Mixer2 + Delivery Fee (FREE)
      expect(prices.subtotal).toBeCloseTo(expectedSubtotal, 2);
    });

    it("should not include 'none' mixers in the price calculation", () => {
      const stateWithNoneMixer = {
        ...initialState,
        extras: [
          ...initialState.extras.map((extra) =>
            extra.id === "slushyMachineSingle"
              ? { ...extra, selected: true }
              : extra,
          ),
        ],
        slushyMixers: [
          {
            machineId: "slushyMachineSingle",
            tankNumber: 1,
            mixerId: "none",
            name: "None",
            price: 0,
          },
        ],
      };

      const prices = calculatePrices(stateWithNoneMixer);

      // The subtotal should only include the slushy machine price (124.95)
      const expectedSubtotal = 124.95 + 0; // Machine + Delivery Fee (FREE)
      expect(prices.subtotal).toBeCloseTo(expectedSubtotal, 2);
    });
  });
});
