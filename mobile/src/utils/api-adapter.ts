import { ApiResponse } from '@/src/types';
import { Verification, VerificationResultPayload } from '@/src/types/verification';

export const adaptApiResponse = (
  res: ApiResponse<Verification>
): VerificationResultPayload => {
  return {
    success: res.success,
    message: res.message,

    requestId: (res.data as any)?.requestId ?? '',
    verification: (res.data as any)?.verification ?? {
      requestId: '',
      processingStatus: 'unknown',
      status: 'unknown',
      verified: false,
    },

    data: Array.isArray((res.data as any)?.data)
      ? (res.data as any).data
      : [(res.data as any)?.data ?? res.data],
  };
};