import React from "react";
import { CheckoutAction, SLUSHY_MIXERS } from "./utils/types";

interface MixerSelectionProps {
  machineId: string; // Add machineId parameter
  tankNumber: number;
  selectedMixer: string;
  dispatch: React.Dispatch<CheckoutAction>;
}

const MixerSelection: React.FC<MixerSelectionProps> = ({
  machineId,
  tankNumber,
  selectedMixer,
  dispatch,
}) => {
  const handleMixerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mixerId = e.target.value;
    const mixer = SLUSHY_MIXERS.find((m) => m.id === mixerId);

    if (mixer) {
      dispatch({
        type: "SELECT_SLUSHY_MIXER",
        payload: {
          machineId,
          tankNumber,
          mixerId: mixer.id,
          name: mixer.name,
          price: mixer.price,
        },
      });
    }
  };

  return (
    <div className="mb-3">
      <label className="block text-gray-700 mb-1">
        Tank {tankNumber} Mixer
      </label>
      <select
        value={selectedMixer}
        onChange={handleMixerChange}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-purple focus:border-primary-purple"
      >
        {SLUSHY_MIXERS.map((mixer) => (
          <option key={mixer.id} value={mixer.id}>
            {mixer.name} {mixer.price > 0 && `(+$${mixer.price.toFixed(2)})`}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MixerSelection;
