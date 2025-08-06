import React, {useState} from "react";
import {useForm, SubmitHandler} from "react-hook-form";


// Updated Question type to support more field types and conditions
type Question = {
 name: string;
 label: string;
 type?: string;
 options?: string[];
 optional?: boolean;
 group?: boolean;
 fields?: Question[];
 condition?: (values: any) => boolean;
};


// Onboarding questions with conditional logic and grouping
const questions: Question[] = [
 {
   name: "firstName",
   label: "Hi! What's your first name?",
 },
 {
   name: "location",
   label: "Where are you located?",
   group: true,
   fields: [
     { name: "country", label: "Country" },
     { name: "zipCode", label: "Zip Code" },
   ],
 },
 {
   name: "gender",
   label: "What's your gender?",
   type: "select",
   options: ["Man", "Woman", "See all"],
 },
 {
   name: "genderOther",
   label: "How do you identify?",
   type: "select",
   options: [
     "Agender",
     "Androgynous",
     "Bigender",
     "Cis Man",
     "Cis Woman",
     "Genderfluid",
     "Genderqueer",
     "Gender Nonconforming",
     "Hijra",
     "Intersex",
     "Non-binary",
     "Other gender",
     "Pangender",
     "Transfeminine",
     "Transgender",
     "Trans Man",
     "Transmasculine",
     "Transsexual",
     "Trans Woman",
     "Two Spirit"
   ],
   optional: true,
   condition: (values) => values.gender === "See all",
 },
 {
   name: "birthday",
   label: "When's your birthday?",
   type: "date",
 },
 {
   name: "relationshipType",
   label: "What kind of relationship are you looking for?",
   type: "multiselect",
   options: [
     "New friend",
     "Short-term relationship",
     "Long-term relationship",
     "Other",
   ],
 },
 {
   name: "kids",
   label: "What are your ideal plans for children? (optional)",
   type: "select",
   options: [
     "Skip",
     "Want someday",
     "Don't want",
     "Have and want more",
     "Have and don't want more",
     "Not sure yet",
     "Have kids",
     "Open to kids",
   ],
   optional: true,
   condition: (values) =>
     ["Short-term dating", "Hookups", "Long-term dating"].includes(
       values.relationshipType
     ),
 },
 {
   name: "nonMonogamy",
   label: "Non-Monogamy Options",
   type: "select",
   options: ["Monogamous", "Non-monogamous", "Open to either"],
   condition: (values) =>
     ["Short-term dating", "Hookups", "Long-term dating"].includes(
       values.relationshipType
     ),
 },
 {
   name: "photos",
   label: "Add photos (optional)",
   type: "file",
   optional: true,
 },
 {
   name: "about",
   label: "Tell us about yourself",
   type: "textarea",
 },
 // Personality questions
 {
   name: "intenseOrCarefree",
   label: "Which word describes you better?",
   type: "select",
   options: ["Intense", "Carefree"],
 },
 {
   name: "religion",
   label: "How important is religion/God in your life?",
   type: "select",
   options: [
     "Not at all important",
     "Slightly important",
     "Moderately important",
     "Very important",
     "Extremely important"
   ]
 },
 {
   name: "politics",
   label: "Which best describes your political beliefs?",
   type: "select",
   options: [
     "Very liberal",
     "Liberal",
     "Moderate",
     "Conservative",
     "Very conservative",
     "Other"
   ]
 },
 {
   name: "introversion",
   label: "How would you describe your social style?",
   type: "select",
   options: [
     "Very introverted",
     "Somewhat introverted",
     "In the middle",
     "Somewhat extroverted",
     "Very extroverted"
   ]
 },
];


// List of valid countries (shortened for brevity, add more as needed)
const countryOptions = [
 "United States", "Canada", "United Kingdom", "Australia", "Germany", "France", "India", "China", "Japan", "Brazil", "Mexico", "Italy", "Spain", "Netherlands", "Sweden", "Norway", "Denmark", "Finland", "Ireland", "New Zealand"
 // ...add more countries as needed
];


type FormValues = {
 [key: string]: any;
};


// Helper to get visible questions based on current form values
const getVisibleQuestions = (values: FormValues) =>
 questions.filter((q) => !q.condition || q.condition(values));


const MultiStepForm: React.FC = () => {
 const [step, setStep] = useState(0);
 const {register, handleSubmit, getValues, formState: {errors}} = useForm<FormValues>();
 const [formValues, setFormValues] = useState<FormValues>({});
 const [showGenderDefs, setShowGenderDefs] = useState(false);


 // Helper to calculate age
 const getAge = (month: string, day: string, year: string) => {
   if (!month || !day || !year) return null;
   const mm = parseInt(month, 10);
   const dd = parseInt(day, 10);
   const yyyy = parseInt(year, 10);
   if (isNaN(mm) || isNaN(dd) || isNaN(yyyy)) return null;
   const today = new Date();
   const birthDate = new Date(yyyy, mm - 1, dd);
   let age = today.getFullYear() - yyyy;
   const m = today.getMonth() - (mm - 1);
   if (m < 0 || (m === 0 && today.getDate() < dd)) {
     age--;
   }
   return age;
 };


 const visibleQuestions = getVisibleQuestions(formValues);
 const isLastStep = step === visibleQuestions.length - 1;
 const currentQuestion = visibleQuestions[step];


 const onSubmit: SubmitHandler<FormValues> = (data) => {
   // Merge the latest form values with the current step's data
   const allValues = { ...formValues, ...getValues() };
   alert(JSON.stringify(allValues, null, 2));
 };


 const nextStep = () => {
   const values = getValues();
   setFormValues((prev) => ({ ...prev, ...values }));
   setStep((s) => Math.min(s + 1, visibleQuestions.length - 1));
 };
 const prevStep = () => setStep((s) => Math.max(s - 1, 0));


 // Questions where skip is allowed (from 'relationshipDuration' onward)
 const skipFrom = visibleQuestions.findIndex(q => q.name === 'relationshipDuration');
 const canSkip = step >= skipFrom && skipFrom !== -1;


 return (
   <form onSubmit={handleSubmit(onSubmit)} className="mt-0 space-y-6 flex flex-col items-center">
     <div className="w-full flex flex-col items-center">
       <label className="px-4 text-center block w-full text-3xl font-bold mb-8 mt-0" style={{marginTop: '0rem'}}>{currentQuestion.label}</label>
       {currentQuestion.group && currentQuestion.fields ? (
         currentQuestion.fields.map((field) => {
           let fieldInput;
           if (field.name === "country") {
             fieldInput = (
               <>
                 <input
                   list="country-list"
                   {...register(field.name, {
                     required: !field.optional,
                     validate: value => countryOptions.includes(value) || "Please select a valid country."
                   })}
                   defaultValue={getValues(field.name) || ""}
                   onKeyDown={(e) => {
                     if (e.key === "Enter") {
                       e.preventDefault();
                       nextStep();
                     }
                   }}
                   className="text-center text-lg py-3 px-5 h-14 rounded-full border w-72"
                 />
                 <datalist id="country-list">
                   {countryOptions.map((country) => (
                     <option key={country} value={country} />
                   ))}
                 </datalist>
               </>
             );
           } else if (field.name === "zipCode") {
             fieldInput = (
               <input
                 type="text"
                 {...register(field.name, {
                   required: !field.optional,
                   pattern: { value: /^\d{5}(-\d{4})?$/, message: "Please enter a valid US zip code." }
                 })}
                 defaultValue={getValues(field.name) || ""}
                 onKeyDown={(e) => {
                   if (e.key === "Enter") {
                     e.preventDefault();
                     nextStep();
                   }
                 }}
                 className="text-center text-lg py-3 px-5 h-14 rounded-full border w-48"
               />
             );
           } else {
             fieldInput = (
               <input
                 type={field.type || "text"}
                 {...register(field.name, { required: !field.optional })}
                 defaultValue={getValues(field.name) || ""}
                 onKeyDown={(e) => {
                   if (e.key === "Enter") {
                     e.preventDefault();
                     nextStep();
                   }
                 }}
                 className="text-center text-lg py-3 px-5 h-14 rounded-full border"
               />
             );
           }
           return (
             <div key={field.name} className="w-full flex flex-col items-center">
               <label className="text-center w-full">{field.label}</label>
               {fieldInput}
               {errors[field.name] && (
                 <span className="block text-center mt-4">
                  {(errors[field.name] as any)?.message || "This field is required"}
                 </span>
              )}
             </div>
           );
         })
       ) : currentQuestion.name === "birthday" ? (
         <div className="flex flex-row gap-2 justify-center items-center mt-2">
           <input
             type="text"
             maxLength={2}
             placeholder="MM"
             {...register("birthday_month", { required: true, pattern: /^(0?[1-9]|1[0-2])$/ })}
             className="rounded-full border px-4 py-2 text-lg text-center w-20"
           />
           <input
             type="text"
             maxLength={2}
             placeholder="DD"
             {...register("birthday_day", { required: true, pattern: /^(0?[1-9]|[12][0-9]|3[01])$/ })}
             className="rounded-full border px-4 py-2 text-lg text-center w-20"
           />
           <input
             type="text"
             maxLength={4}
             placeholder="YYYY"
             {...register("birthday_year", { required: true, pattern: /^[0-9]{4}$/ })}
             className="rounded-full border px-4 py-2 text-lg text-center w-28"
           />
           {(() => {
             const month = getValues("birthday_month");
             const day = getValues("birthday_day");
             const year = getValues("birthday_year");
             const age = getAge(month, day, year);
             if (age && age > 0 && age < 120) {
               return <span className="ml-4 text-lg font-semibold text-blue-700">You are {age}!</span>;
             }
             return null;
           })()}
         </div>
       ) : (currentQuestion.type === "select" && currentQuestion.options && currentQuestion.options.length <= 6) ? (
         <div className="flex flex-wrap gap-2 mt-2 justify-center">
           {currentQuestion.options.map((opt) => (
             <button
               key={opt}
               type="button"
               className={`px-4 py-2 rounded-full border ${formValues[currentQuestion.name] === opt ? 'bg-red-700 text-white' : 'bg-gray-100 dark:bg-gray-700'} hover:bg-red-100 dark:hover:bg-red-800 transition-colors`}
               onClick={() => {
                 setFormValues({ ...formValues, [currentQuestion.name]: opt });
                 setStep((s) => Math.min(s + 1, visibleQuestions.length - 1));
               }}
             >
               {opt}
             </button>
           ))}
         </div>
       ) : (currentQuestion.type === "multiselect" && currentQuestion.options && currentQuestion.options.length <= 6) ? (
         <div className="flex flex-wrap gap-2 mt-2 justify-center">
           {currentQuestion.options.map((opt) => {
             const selected = (formValues[currentQuestion.name] || []).includes(opt);
             return (
               <button
                 key={opt}
                 type="button"
                 className={`px-4 py-2 rounded-full border ${selected ? 'bg-red-700 text-white' : 'bg-gray-100 dark:bg-gray-700'} hover:bg-red-100 dark:hover:bg-red-800 transition-colors`}
                 onClick={() => {
                   const prev = formValues[currentQuestion.name] || [];
                   const next = selected ? prev.filter((v: string) => v !== opt) : [...prev, opt];
                   setFormValues({ ...formValues, [currentQuestion.name]: next });
                 }}
               >
                 {opt}
               </button>
             );
           })}
         </div>
       ) : currentQuestion.type === "select" ? (
         <select
           {...register(currentQuestion.name, { required: !currentQuestion.optional })}
           className="px-4 text-center text-lg py-3 h-14 rounded-full border"
           onKeyDown={(e) => {
             if (e.key === "Enter") {
               e.preventDefault();
               nextStep();
             }
           }}
         >
           <option value="">Select...</option>
           {currentQuestion.options?.map((opt) => (
             <option key={opt} value={opt}>
               {opt}
             </option>
           ))}
         </select>
       ) : currentQuestion.type === "multiselect" ? (
         <select
           multiple
           {...register(currentQuestion.name, { required: !currentQuestion.optional })}
           className="px-4 border rounded-full w-full min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-400 text-center text-lg py-3 h-14"
           style={{ minHeight: 44, boxSizing: 'border-box', cursor: 'pointer' }}
           onKeyDown={(e) => {
             if (e.key === "Enter") {
               e.preventDefault();
               nextStep();
             }
           }}
         >
           {currentQuestion.options?.map((opt) => (
             <option key={opt} value={opt}>
               {opt}
             </option>
           ))}
         </select>
         // For a more advanced UI, consider using react-select's MultiSelect component
       ) : currentQuestion.type === "textarea" ? (
         <textarea
           {...register(currentQuestion.name, { required: !currentQuestion.optional })}
           defaultValue={getValues(currentQuestion.name) || ""}
           className="text-center text-lg py-3 px-5 h-28 rounded-lg border"
         />
       ) : currentQuestion.type === "file" ? (
         <input
           type="file"
           {...register(currentQuestion.name)}
           className="text-center text-lg py-3 px-5 h-14 rounded-full border"
         />
       ) : (currentQuestion.name === "genderOther") ? (
         <div className="flex flex-col items-center w-full">
           <select
             {...register(currentQuestion.name, { required: !currentQuestion.optional })}
             className="px-4 text-center text-lg py-3 h-14 rounded-full border w-full max-w-xl"
           >
             <option value="">Select...</option>
             {questions.find(q => q.name === "genderOther")?.options?.map((opt) => (
               <option key={opt} value={opt}>{opt}</option>
             ))}
           </select>
           <button
             type="button"
             className="mt-4 mb-2 px-4 py-2 rounded-full border bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
             onClick={() => setShowGenderDefs((v) => !v)}
           >
             {showGenderDefs ? "Hide definitions" : "Show definitions"}
           </button>
           {showGenderDefs && (
             <div className="mt-2 p-4 bg-white border rounded-lg shadow max-w-xl text-left text-sm overflow-y-auto max-h-96">
               <ul className="list-disc pl-5">
                 <li><b>Agender</b>: Individuals with no gender identity or a neutral gender identity.</li>
                 <li><b>Androgynous</b>: Individuals with both male & female presentation or nature.</li>
                 <li><b>Bigender</b>: Individuals who identify as multiple genders/identities, either simultaneously or at different times.</li>
                 <li><b>Cis Man</b>: Individuals whose gender identity matches the male sex they were assigned at birth.</li>
                 <li><b>Cis Woman</b>: Individuals whose gender identity matches the female sex they were assigned at birth.</li>
                 <li><b>Genderfluid</b>: Individuals who don’t have a fixed gender identity.</li>
                 <li><b>Genderqueer</b>: Individuals who don’t identify with binary gender identity norms.</li>
                 <li><b>Gender Nonconforming</b>: Individuals whose gender expressions don’t match masculine & feminine gender norms.</li>
                 <li><b>Hijra</b>: A third gender identity, largely used in the Indian subcontinent, which typically reflects people who were assigned male at birth, with feminine gender expression, who identify as neither male nor female.</li>
                 <li><b>Intersex</b>: Individuals born with a reproductive or sexual anatomy that doesn’t fit the typical definitions of female or male.</li>
                 <li><b>Non-binary</b>: A term covering any gender identity or expression that doesn’t fit within the gender binary.</li>
                 <li><b>Other gender</b>: Individuals who identify with any other gender expressions.</li>
                 <li><b>Pangender</b>: Individuals who identify with a wide multiplicity of gender identities.</li>
                 <li><b>Transfeminine</b>: Transgender individuals whose gender expression is more feminine presenting.</li>
                 <li><b>Transgender</b>: Individuals whose gender identity differs from the sex they were assigned at birth.</li>
                 <li><b>Trans Man</b>: Individuals who were assigned female at birth (AFAB) but have a male gender identity.</li>
                 <li><b>Transmasculine</b>: Transgender individuals whose gender expression is more masculine presenting.</li>
                 <li><b>Transsexual</b>: This term is sometimes used to describe trans individuals (who do not identify with the sex they were assigned at birth) who wish to align their gender identity & sex through medical intervention.</li>
                 <li><b>Trans Woman</b>: Individuals who were assigned male at birth (AMAB) but have a female gender identity.</li>
                 <li><b>Two Spirit</b>: Term largely used in Indigenous, Native American, and First Nation cultures, reflecting individuals who identify with multiple genders/gender identities that are neither male nor female.</li>
               </ul>
             </div>
           )}
         </div>
       ) : (
         <input
           type={currentQuestion.type || "text"}
           {...register(currentQuestion.name, { required: !currentQuestion.optional })}
           defaultValue={getValues(currentQuestion.name) || ""}
           onKeyDown={(e) => {
             if (e.key === "Enter") {
               e.preventDefault();
               nextStep();
             }
           }}
           className="text-center text-lg py-3 px-5 h-14 rounded-full border"
         />
       )}
       {errors[currentQuestion.name] && <span className="block text-center mt-4">This field is required</span>}
     </div>
     <div className="flex flex-row justify-center items-center w-full mt-16 gap-4">
       {step > 0 && (
         <button
           type="button"
           onClick={prevStep}
           className="rounded-full px-6 py-2 font-semibold bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
         >
           Back
         </button>
       )}
       {canSkip && (
         <button
           type="button"
           onClick={() => {
             setFormValues((prev) => ({ ...prev, [currentQuestion.name]: "" }));
             setStep((s) => Math.min(s + 1, visibleQuestions.length - 1));
           }}
           className="rounded-full px-6 py-2 font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
         >
           Skip
         </button>
       )}
       {!isLastStep ? (
         <button
           type="button"
           onClick={() => {
             handleSubmit(() => nextStep())();
           }}
           className="rounded-full px-6 py-2 font-semibold bg-red-700 text-white hover:bg-red-800 transition-colors"
         >
           Next
         </button>
       ) : (
         <button
           type="submit"
           className="rounded-full px-6 py-2 font-semibold bg-red-700 text-white hover:bg-red-800 transition-colors"
         >
           Submit
         </button>
       )}
     </div>
   </form>
 );
};


export default MultiStepForm;






