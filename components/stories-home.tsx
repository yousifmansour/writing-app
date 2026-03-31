import { AuthStatusCard } from "@/components/auth-status-card";
import { NewStoryButton } from "@/components/new-story-button";
import { StoriesList } from "@/components/stories-list";

export function StoriesHome() {
  return (
    <main>
      <AuthStatusCard />

      <section>
        <h1>Your Stories</h1>
        <StoriesList />
        <div>
          <NewStoryButton />
        </div>
      </section>
    </main>
  );
}
