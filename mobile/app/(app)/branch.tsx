import { Redirect } from 'expo-router';

// Legacy route retained for backwards compatibility.
// Branch management now lives in the multi-branch `/branch-management` screen.
export default function BranchScreen() {
  return <Redirect href="/branch-management" />;
}
