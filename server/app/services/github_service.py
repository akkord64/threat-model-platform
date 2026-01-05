from github import Github, GithubException
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class GitHubService:
    def __init__(self, token: str = None):
        # Default client using env settings
        self.default_token = token or settings.GITHUB_TOKEN
        self.default_repo = settings.GITHUB_REPO
        self.client = Github(self.default_token) if self.default_token else None

    def _get_client(self, token: str = None):
        if token:
            return Github(token)
        if self.client:
            return self.client
        raise Exception("GitHub Token not configured")

    def _get_repo_obj(self, client, repo_name: str = None):
        name = repo_name or self.default_repo
        if not name:
            raise Exception("GitHub Repository not configured")
        return client.get_repo(name)

    def save_otm(self, filename: str, content: str, message: str = "Update OTM"):
        """
        Saves or updates a file in the default configured repository (Env vars).
        """
        if not self.client:
            raise Exception("Server-side GitHub Token not configured")
            
        repo = self._get_repo_obj(self.client)
        try:
            # Try to get the file to see if it exists
            contents = repo.get_contents(filename)
            # If it exists, update it
            repo.update_file(contents.path, message, content, contents.sha)
            logger.info(f"Updated file {filename} in {repo.full_name}")
            return {"status": "updated", "path": filename}
        except GithubException as e:
            if e.status == 404:
                # File not found, create it
                repo.create_file(filename, message, content)
                logger.info(f"Created file {filename} in {repo.full_name}")
                return {"status": "created", "path": filename}
            else:
                logger.error(f"GitHub Error: {e}")
                raise e

    def fetch_file_content(self, repo_name: str, file_path: str, token: str) -> str:
        """
        Fetches file content using a dynamic token and repo.
        """
        logger.info(f"Fetching file '{file_path}' from repo '{repo_name}'")
        try:
            client = self._get_client(token)
            repo = self._get_repo_obj(client, repo_name)
            logger.info(f"Connected to repo: {repo.full_name}")
            
            contents = repo.get_contents(file_path)
            logger.info(f"File content retrieved (size: {contents.size})")
            
            return contents.decoded_content.decode("utf-8")
        except GithubException as e:
            logger.error(f"GitHub Fetch Error in Service: {e.status} {e.data}")
            raise Exception(f"Failed to fetch file: {e.data.get('message', str(e))}")
        except Exception as e:
            logger.error(f"Unexpected Error in GitHubService.fetch: {str(e)}")
            raise e

    def push_file_content(self, repo_name: str, file_path: str, content: str, message: str, token: str) -> dict:
        """
        Pushes file content using a dynamic token and repo.
        """
        logger.info(f"Pushing file '{file_path}' to repo '{repo_name}'")
        try:
            client = self._get_client(token)
            repo = self._get_repo_obj(client, repo_name)
            
            try:
                contents = repo.get_contents(file_path)
                logger.info(f"File exists, updating: {file_path}")
                repo.update_file(contents.path, message, content, contents.sha)
                return {"status": "updated", "path": file_path}
            except GithubException as e:
                if e.status == 404:
                    logger.info(f"File not found, creating: {file_path}")
                    repo.create_file(file_path, message, content)
                    return {"status": "created", "path": file_path}
                raise e
        except GithubException as e:
            logger.error(f"GitHub Push Error in Service: {e.status} {e.data}")
            raise Exception(f"Failed to push file: {e.data.get('message', str(e))}")
