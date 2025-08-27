import SetupInstructions from "./setup-instructions";

export default function SetupPage() {
  return (
    <div className="min-h-screen  flex flex-col items-center justify-center p-8">
      <div className="max-w-3xl w-full  rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-6 ">
          Welcome to Compass
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          It looks like your database isn&apos;t set up yet. Follow the
          instructions below to get started.
        </p>

        <SetupInstructions />
      </div>
    </div>
  );
}
