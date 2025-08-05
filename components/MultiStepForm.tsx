import React, {useState} from "react";
import {useForm, SubmitHandler} from "react-hook-form";

type Question = {
  name: string;
  label: string;
  type?: string;
  options?: string[];
};

const questions: Question[] = [
  {
    name: "firstName",
    label: "First Name"
  },
  {
    name: "lastName",
    label: "Last Name"
  },
  {
    name: "age",
    label: "Age",
    type: "number"
  },
  {
    name: "gender",
    label: "Gender",
    type: "select",
    options: ["Male", "Female", "Other"],
  },
];

type FormValues = {
  [key: string]: any;
};

const MultiStepForm: React.FC = () => {
  const [step, setStep] = useState(0);
  const {register, handleSubmit, getValues, formState: {errors}} = useForm<FormValues>();
  const isLastStep = step === questions.length - 1;

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    // handle final form submission
    alert(JSON.stringify(data, null, 2));
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, questions.length - 1));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const currentQuestion = questions[step];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
      <div>
        <label  className="px-4">{currentQuestion.label}</label>
        {currentQuestion.type === "select" ? (
          <select {...register(currentQuestion.name, {required: true})} className="px-4">
            <option value="">Select...</option>
            {currentQuestion.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input
            type={currentQuestion.type || "text"}
            {...register(currentQuestion.name, {required: true})}
            defaultValue={getValues(currentQuestion.name) || ""}
          />
        )}
        {errors[currentQuestion.name] && <span>This field is required</span>}
      </div>
      <div style={{margin: 16,}}>
        {step > 0 && (
          <button type="button" onClick={prevStep} style={{margin: 16,}}>
            Back
          </button>
        )}
        {!isLastStep ? (
          <button
            type="button"
            onClick={() => {
              // Validate current step before proceeding
              handleSubmit(() => nextStep())();
            }}
          >
            Next
          </button>
        ) : (
          <button type="submit">Submit</button>
        )}
      </div>
    </form>
  );
};

export default MultiStepForm;

