export function formatSubmission({ emailLogin, submittedAt, answers, questionMap }) {
  return {
    emailLogin: emailLogin.trim().toLowerCase(),
    submittedAt: submittedAt || new Date().toISOString(),
    answers,
    questionMap: questionMap || {},
    metadata: {
      totalAnswers: Object.keys(answers || {}).length,
      receivedAt: new Date().toISOString(),
    },
  };
}