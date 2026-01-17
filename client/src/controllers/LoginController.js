import { useUserStore } from '../stores/user';
import { router } from '../router';
import { User } from '../models/User';
import axios from 'axios';
import { ROUTES } from '../routes/api';

export class LoginController {
    static async login(username) {
        // Validate input locally first
        const user = new User(username);
        if (!user.isValid()) return;

        try {
            // Simulate HTTP Request
            // In a real app: const response = await axios.post(ROUTES.LOGIN, { username });

            // Simulating API behavior for now
            // We use axios just to import it as requested, but we mock the call/response
            console.log(`POST request to ${ROUTES.LOGIN} with payload:`, { username });

            // Mock Response
            const mockResponse = {
                data: {
                    username: username,
                    id: 123,
                    token: 'mock-jwt-token'
                }
            };

            // Parse response using Model
            const authenticatedUser = User.fromApiResponse(mockResponse.data);

            const userStore = useUserStore();
            userStore.login(authenticatedUser.username);
            router.push('/play');

        } catch (error) {
            console.error('Login failed:', error);
            alert('Login failed. Check console for details.');
        }
    }
}
