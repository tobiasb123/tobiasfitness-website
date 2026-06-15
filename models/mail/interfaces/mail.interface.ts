export interface Mail {
  to: string[];
  message: {
    subject: string;
    html: string;
  };
}
