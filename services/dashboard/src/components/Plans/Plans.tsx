/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Button, Card, Divider, Typography } from "@mui/joy";
import DoneIcon from "@mui/icons-material/Done";
import { CheckCircle } from "@mui/icons-material";
import { useMe } from "../../api/queries/auth";

const plans = [
  {
    name: "Free",
    description: "For sole developers",
    seats: 1,
    price: 0,
    initialInvestigation: true,
    incidentSummary: false,
    integrations: "Up to 2 integrations",
    customizedFeatures: false,
    onPerm: false,
    fineTuning: false,
  },
  {
    name: "Business",
    description: "For small teams",
    seats: 30,
    price: 900,
    initialInvestigation: true,
    incidentSummary: false,
    integrations: "Supported Integrations",
    support: "Business hours support",
    customizedFeatures: false,
    onPerm: false,
    fineTuning: false,
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    seats: -1,
    initialInvestigation: true,
    incidentSummary: true,
    integrations: "Customized Integrations",
    support: "24/7 Support",
    customizedFeatures: true,
    onPerm: true,
    fineTuning: true,
  },
];

const features = (plan: any) => {
  return plan
    ? [
        {
          title:
            plan.seats === -1 ? "Unlimited seats" : `Up to ${plan.seats} seats`,
          included: true,
        },
        { title: "Initial Investigation", included: plan.initialInvestigation },
        { title: "Incident Summary", included: plan.incidentSummary },
        { title: plan.integrations, included: true },
        { title: "Customized Features", included: plan.customizedFeatures },
        { title: "On prem", included: plan.onPerm },
        { title: "Fine-tuned model", included: plan.fineTuning },
        { title: plan.support, included: !!plan.support },
      ]
    : [];
};

const PlanCard = ({ plan, isSelected, onSelect }: any) => {
  const { name, price, description } = plan;

  return (
    <Card
      sx={{
        width: "400px",
        borderWidth: isSelected ? "2px" : "1px",
        boxShadow: isSelected ? "#00802c6b 0px 0px 6px 0px" : "none",
      }}
    >
      <Typography level="title-lg">{name}</Typography>
      {isSelected && (
        <CheckCircle
          sx={{
            position: "absolute",
            top: "15px",
            right: "15px",
            fontSize: "30px",
          }}
          color="success"
        />
      )}
      <span>
        <Typography level="h1" sx={{ display: "inline" }}>
          {price || price === 0 ? `$${price}` : "Let's talk"}
        </Typography>
        {price ? "/month" : ""}
      </span>
      <Typography level="title-md">{description}</Typography>
      <Divider sx={{ margin: "30px 0" }} />

      {features(plan)
        .filter(({ included }): any => included)
        .map((feature: any) => {
          const { title } = feature;

          return (
            <Box
              key={title}
              sx={{ display: "flex", alignItems: "center", margin: "5px 0" }}
            >
              <DoneIcon color="success" sx={{ marginRight: "10px" }} />

              <Typography level="body-lg">{title}</Typography>
            </Box>
          );
        })}

      <Divider sx={{ marginTop: "20px", background: "transparent" }} />

      <Button
        variant="solid"
        color="primary"
        sx={{ marginTop: "auto" }}
        disabled={isSelected}
        onClick={() => onSelect(plan)}
      >
        {isSelected ? "Selected" : "Select"}
      </Button>
    </Card>
  );
};

export const Plans = ({ onSelect }: any) => {
  const { data: user } = useMe();

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-around",
        marginTop: "50px",
      }}
    >
      {plans.map((plan) => (
        <PlanCard
          plan={plan}
          key={plan.name}
          isSelected={
            plan.name.toLowerCase() === user?.organization?.plan?.name
          }
          onSelect={onSelect}
        />
      ))}
    </Box>
  );
};
