
import UserHeader from "./UserHeader";
import ScrobblesList from "./ScrobblesList";

const Dashboard: React.FC = () => {
  return (
    <div className="container max-w-2xl mx-auto py-6 px-4">
      <UserHeader />
      <ScrobblesList />
    </div>
  );
};

export default Dashboard;
