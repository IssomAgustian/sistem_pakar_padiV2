import React, { createContext, useState, useContext } from 'react';

const DiagnosisContext = createContext();

export const useDiagnosis = () => {
  const context = useContext(DiagnosisContext);
  if (!context) {
    throw new Error('useDiagnosis must be used within DiagnosisProvider');
  }
  return context;
};

export const DiagnosisProvider = ({ children }) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [certaintyValues, setCertaintyValues] = useState({});
  const [loading, setLoading] = useState(false);

  const addSymptom = (symptom) => {
    setSelectedSymptoms(prev => [...prev, symptom]);
  };

  const removeSymptom = (symptomId) => {
    setSelectedSymptoms(prev => prev.filter(s => s.id !== symptomId));
  };

  const clearSymptoms = () => {
    setSelectedSymptoms([]);
    setCertaintyValues({});
  };

  const setResult = (result) => {
    setDiagnosisResult(result);
  };

  const submitWithCertainty = async (symptomIds, certaintyVals) => {
    setLoading(true);
    setCertaintyValues(certaintyVals);

    try {
      // This will be implemented when backend is integrated
      // For now, just store the values
      return { success: true };
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    selectedSymptoms,
    diagnosisResult,
    certaintyValues,
    loading,
    addSymptom,
    removeSymptom,
    clearSymptoms,
    setResult,
    setCertaintyValues,
    submitWithCertainty,
  };

  return (
    <DiagnosisContext.Provider value={value}>
      {children}
    </DiagnosisContext.Provider>
  );
};
