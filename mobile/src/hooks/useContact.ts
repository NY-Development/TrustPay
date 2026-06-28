import { useMutation } from '@tanstack/react-query';
import { contactApi, ContactRequest } from '../api/contact.api';

export const useSubmitContact = () => {
  return useMutation({
    mutationFn: (data: ContactRequest) => contactApi.submit(data),
  });
};
