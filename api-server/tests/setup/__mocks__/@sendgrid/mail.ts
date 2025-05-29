// Mock implementation of @sendgrid/mail for testing
const mockSgMail = {
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([{
    statusCode: 202,
    body: {},
    headers: {}
  }]),
};

export default mockSgMail;
