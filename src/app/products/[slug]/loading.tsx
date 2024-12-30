import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";

export default function Loading() {
  return (
    <div className="min-h-screen flex justify-center items-center">
      <LoadingSpinner color="#3B82F6" size={60} />
    </div>
  );
}
