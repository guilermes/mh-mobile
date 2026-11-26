import { useAuth } from '@/context/AuthContext';
import { LoginScreen } from '@/screens/LoginScreen';

export default function Login() {
  const { signIn } = useAuth();
  return <LoginScreen onSubmit={signIn} />;
}