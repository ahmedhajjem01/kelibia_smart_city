from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

class AgentCitizenVerificationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create different types of agents
        self.agent_civil = User.objects.create_user(
            username='agent_civil',
            email='agent_civil@kelibia.tn',
            password='Password123!',
            user_type='agent',
            assigned_service='civil_registry',
            cin='11111111'
        )
        self.agent1 = User.objects.create_user(
            username='agent1',
            email='agent1@kelibiasmartcity.tn',
            password='Password123!',
            user_type='agent',
            assigned_service=None,
            cin='22222222'
        )
        self.agent_other = User.objects.create_user(
            username='agent_ben_ali',
            email='agent1@mairie-kelibia.tn',
            password='Password123!',
            user_type='agent',
            assigned_service='lighting',
            cin='33333333'
        )
        
        # Create some citizens (one verified, one unverified)
        self.citizen_unverified = User.objects.create_user(
            username='citizen_unverified',
            email='citoyen1@kelibia.tn',
            password='Password123!',
            user_type='citizen',
            is_verified=False,
            cin='44444444'
        )
        self.citizen_verified = User.objects.create_user(
            username='citizen_verified',
            email='citoyen2@kelibia.tn',
            password='Password123!',
            user_type='citizen',
            is_verified=True,
            cin='55555555'
        )

    def test_agent_civil_access(self):
        self.client.force_authenticate(user=self.agent_civil)
        response = self.client.get('/api/accounts/agent-citizens/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Default should return only unverified
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.citizen_unverified.id)

    def test_agent1_access(self):
        self.client.force_authenticate(user=self.agent1)
        response = self.client.get('/api/accounts/agent-citizens/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_agent_other_denied(self):
        self.client.force_authenticate(user=self.agent_other)
        response = self.client.get('/api/accounts/agent-citizens/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_agent_civil_mode_all(self):
        self.client.force_authenticate(user=self.agent_civil)
        response = self.client.get('/api/accounts/agent-citizens/', {'mode': 'all'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # mode=all should return both verified and unverified
        self.assertEqual(len(response.data), 2)
