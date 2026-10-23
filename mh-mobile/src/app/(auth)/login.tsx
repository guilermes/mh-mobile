import { useAuth } from '../../auth/AuthContext';
import { LoginScreen } from '../../screens/LoginScreen';

export default function Login() {
  const { signIn } = useAuth();
  return <LoginScreen onSubmit={signIn} />;
}