import { useEffect, useState } from "react";
import { defaultBeans, defaultSetup, defaultShots } from "./data";
import { getRecommendation } from "./dialIn";
import { Icon } from "./icons";
import { loadData, saveData } from "./storage";

const defaultData = {
  profile: null,
  workspace: null,
  setup: defaultSetup,
  beans: defaultBeans,
  shots: defaultShots,
};

const beanRoastLevels = [
  "Light",
  "Light-Medium",
  "Medium",
  "Medium-Dark",
  "Dark",
];
const roastLevels = [...beanRoastLevels, "Unknown"];
const tastes = ["Sour", "Bitter", "Watery", "Weak", "Balanced"];
const optionalSetupDefaults = {
  basketSize: "",
  defaultDose: "",
  defaultWaterTemperature: "",
  portafilterType: "",
  puckScreen: "",
  wdt: "",
  distributionTool: "",
  tamperType: "",
};
const tasteHabitDefaults = {
  mainDrinkStyle: "",
  experienceLevel: "",
  preferredRoast: "",
  preferredTasteDirection: "",
};

function ratio(dose, shotYield) {
  const value = Number(shotYield) / Number(dose);
  return Number.isFinite(value) ? `1:${value.toFixed(1)}` : "—";
}

function shortDate(value) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
    new Date(value),
  );
}

function stableId(prefix) {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${id}`;
}

function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function App() {
  const [data, setData] = useState(() => loadData(defaultData));
  const [screen, setScreen] = useState("home");
  const [selectedBeanId, setSelectedBeanId] = useState(
    () => loadData(defaultData).beans.find((bean) => bean.active)?.id,
  );
  const [lastShotId, setLastShotId] = useState(null);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const activeBean =
    data.beans.find((bean) => bean.active) || data.beans[0] || null;
  const selectedBean =
    data.beans.find((bean) => bean.id === selectedBeanId) || activeBean;
  const recentShot = data.shots[0] || null;

  function navigate(nextScreen) {
    setScreen(nextScreen);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveOnboarding(form) {
    const fullName = form.fullName.trim();
    const workspaceName = form.workspaceName.trim() || "Home setup";
    const grinder = form.hasBuiltInGrinder
      ? "Built-in grinder"
      : form.grinder.trim();
    const setupDetails = {
      basketSize: form.basketSize,
      defaultDose: form.defaultDose,
      defaultWaterTemperature: form.defaultWaterTemperature,
      portafilterType: form.portafilterType,
      puckScreen: form.puckScreen,
      wdt: form.wdt,
      distributionTool: form.distributionTool,
      tamperType: form.tamperType,
    };
    const tasteHabits = {
      mainDrinkStyle: form.mainDrinkStyle,
      experienceLevel: form.experienceLevel,
      preferredRoast: form.preferredRoast,
      preferredTasteDirection: form.preferredTasteDirection,
    };

    setData((current) => ({
      ...current,
      profile: {
        ...current.profile,
        fullName,
        tasteHabits,
      },
      workspace: {
        ...current.workspace,
        id: current.workspace?.id || "workspace-home",
        name: workspaceName,
        setupDetails,
      },
      setup: {
        ...current.setup,
        machine: form.machine.trim(),
        grinder,
        hasBuiltInGrinder: form.hasBuiltInGrinder,
      },
    }));
    navigate("home");
  }

  function updateProfile(form) {
    setData((current) => ({
      ...current,
      profile: {
        ...current.profile,
        fullName: form.fullName.trim(),
        tasteHabits: {
          ...current.profile?.tasteHabits,
          mainDrinkStyle: form.mainDrinkStyle,
          experienceLevel: form.experienceLevel,
          preferredRoast: form.preferredRoast,
          preferredTasteDirection: form.preferredTasteDirection,
        },
      },
    }));
    navigate("home");
  }

  function updateMachine(form) {
    setData((current) => ({
      ...current,
      setup: {
        ...current.setup,
        machine: form.machine.trim(),
        grinder: form.hasBuiltInGrinder
          ? "Built-in grinder"
          : form.grinder.trim(),
        hasBuiltInGrinder: form.hasBuiltInGrinder,
      },
    }));
    navigate("home");
  }

  function updateSetup(form) {
    setData((current) => ({
      ...current,
      workspace: {
        ...current.workspace,
        name: form.workspaceName.trim() || "Home setup",
        setupDetails: {
          ...current.workspace?.setupDetails,
          basketSize: form.basketSize,
          defaultDose: form.defaultDose,
          defaultWaterTemperature: form.defaultWaterTemperature,
          portafilterType: form.portafilterType,
          puckScreen: form.puckScreen,
          wdt: form.wdt,
          distributionTool: form.distributionTool,
          tamperType: form.tamperType,
        },
      },
      setup: {
        ...current.setup,
        machine: form.machine.trim(),
        grinder: form.hasBuiltInGrinder
          ? "Built-in grinder"
          : form.grinder.trim(),
        hasBuiltInGrinder: form.hasBuiltInGrinder,
      },
    }));
    navigate("home");
  }

  function updateBean(bean) {
    setData((current) => ({
      ...current,
      beans: current.beans.map((item) => (item.id === bean.id ? bean : item)),
    }));
    setSelectedBeanId(bean.id);
    navigate("bean");
  }

  function addBean(bean) {
    const savedBean = {
      ...bean,
      id: stableId("bean"),
      active: data.beans.length === 0,
      recipe: null,
    };

    setData((current) => ({
      ...current,
      beans: [...current.beans, savedBean],
    }));
    setSelectedBeanId(savedBean.id);
    navigate("bean");
  }

  function setActiveBean(beanId) {
    setData((current) => ({
      ...current,
      beans: current.beans.map((bean) => ({
        ...bean,
        active: bean.id === beanId,
      })),
    }));
    setSelectedBeanId(beanId);
  }

  function addShot(shot) {
    const savedShot = {
      ...shot,
      id: stableId("shot"),
      createdAt: new Date().toISOString(),
      beanId: selectedBean.id,
      recommendation: shot.taste
        ? getRecommendation(shot)
        : {
            action: "Shot saved",
            detail:
              "Your recipe is in the log. Add a taste result next time for a more specific recommendation.",
            direction: "repeat",
          },
    };

    setData((current) => ({
      ...current,
      shots: [savedShot, ...current.shots],
      beans: current.beans.map((bean) =>
        bean.id === selectedBean.id
          ? {
              ...bean,
              recipe: {
                ...bean.recipe,
                dose: shot.dose,
                yield: shot.yield,
                extractionTime: shot.extractionTime,
                waterTemperature: shot.waterTemperature,
                grindSize: shot.grindSize,
              },
            }
          : bean,
      ),
    }));
    setLastShotId(savedShot.id);
    navigate("recommendation");
  }

  const lastShot =
    data.shots.find((shot) => shot.id === lastShotId) || recentShot;

  if (!data.profile || !data.workspace) {
    return (
      <div className="app-shell">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <main className="app-content">
          <OnboardingScreen onSave={saveOnboarding} />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <main className="app-content">
        {screen === "home" && (
          <HomeScreen
            profile={data.profile}
            workspace={data.workspace}
            setup={data.setup}
            activeBean={activeBean}
            recentShot={recentShot}
            recentBean={data.beans.find(
              (bean) => bean.id === recentShot?.beanId,
            )}
            onProfile={() => navigate("profile")}
            onMachine={() => navigate("machine")}
            onSetup={() => navigate("setup")}
            onBeans={() => navigate("beans")}
            onShots={() => navigate("shots")}
            onBean={() => {
              setSelectedBeanId(activeBean?.id);
              navigate("bean");
            }}
            onShot={() => {
              setSelectedBeanId(activeBean?.id);
              navigate("shot");
            }}
          />
        )}
        {screen === "profile" && (
          <ProfileScreen
            profile={data.profile}
            onBack={() => navigate("home")}
            onSave={updateProfile}
          />
        )}
        {screen === "machine" && (
          <MachineScreen
            setup={data.setup}
            onBack={() => navigate("home")}
            onSave={updateMachine}
          />
        )}
        {screen === "setup" && (
          <SetupScreen
            workspace={data.workspace}
            setup={data.setup}
            onBack={() => navigate("home")}
            onSave={updateSetup}
          />
        )}
        {screen === "beans" && (
          <BeansScreen
            beans={data.beans}
            onBack={() => navigate("home")}
            onAdd={() => navigate("addBean")}
            onSelect={(id) => {
              setSelectedBeanId(id);
              navigate("bean");
            }}
          />
        )}
        {screen === "addBean" && (
          <BeanFormScreen
            onBack={() => navigate("beans")}
            onSave={addBean}
          />
        )}
        {screen === "bean" && selectedBean && (
          <BeanDetailScreen
            bean={selectedBean}
            shots={data.shots.filter((shot) => shot.beanId === selectedBean.id)}
            onBack={() => navigate("beans")}
            onEdit={() => navigate("editBean")}
            onActivate={() => setActiveBean(selectedBean.id)}
            onShot={() => navigate("shot")}
          />
        )}
        {screen === "editBean" && selectedBean && (
          <BeanFormScreen
            bean={selectedBean}
            onBack={() => navigate("bean")}
            onSave={updateBean}
          />
        )}
        {screen === "shots" && (
          <ShotLogScreen
            shots={data.shots}
            beans={data.beans}
            onBack={() => navigate("home")}
            onSelectBean={(beanId) => {
              setSelectedBeanId(beanId);
              navigate("bean");
            }}
          />
        )}
        {screen === "shot" && selectedBean && (
          <ShotScreen
            bean={selectedBean}
            workspace={data.workspace}
            onBack={() => navigate("bean")}
            onSave={addShot}
          />
        )}
        {screen === "recommendation" && lastShot && (
          <RecommendationScreen
            shot={lastShot}
            bean={selectedBean}
            onDone={() => navigate("home")}
            onAgain={() => navigate("shot")}
          />
        )}
      </main>

      {!["shot", "recommendation", "editBean", "addBean"].includes(screen) && (
        <BottomNav screen={screen} navigate={navigate} />
      )}
    </div>
  );
}

function HomeScreen({
  profile,
  workspace,
  setup,
  activeBean,
  recentShot,
  recentBean,
  onProfile,
  onMachine,
  onSetup,
  onBeans,
  onShots,
  onBean,
  onShot,
}) {
  return (
    <div className="screen home-screen">
      <header className="home-header">
        <div className="brand">
          <span className="brand-mark">
            <span />
          </span>
          <span>COFFEE LAB</span>
        </div>
        <button
          className="profile-trigger"
          onClick={onProfile}
          aria-label="Open profile"
        >
          <span>{profile.fullName}</span>
          <span className="avatar">{initials(profile.fullName)}</span>
        </button>
      </header>

      <section className="hero">
        <p className="eyebrow">YOUR MORNING RITUAL</p>
        <h1>
          Good morning, {profile.fullName.split(/\s+/)[0]}.
          <br />
          <em>Ready to dial in?</em>
        </h1>
        <p className="hero-tagline">Every shot is data.</p>
      </section>

      <button className="primary-button primary-button-large" onClick={onShot}>
        <span className="button-icon">
          <Icon name="plus" />
        </span>
        <span>
          <strong>Start a Shot</strong>
          <small>Dial in {activeBean?.name || "your espresso"}</small>
        </span>
        <Icon name="arrow" />
      </button>

      <SectionHeading title="Your setup" action="Edit" onAction={onSetup} />
      <button className="setup-card" onClick={onMachine}>
        <div className="machine-illustration">
          <div className="machine-top" />
          <div className="machine-face">
            <span />
            <span />
          </div>
          <div className="machine-group" />
          <div className="machine-cup" />
          {!setup.hasBuiltInGrinder && !setup.grinder?.trim() && (
            <span className="add-grinder-badge">
              <Icon name="plus" size={14} />
              Add grinder
            </span>
          )}
        </div>
        <div className="setup-copy">
          <span className="status-label">
            <i /> READY
          </span>
          <h3>{setup.machine}</h3>
          <p>{setup.grinder || "No grinder configured"}</p>
          <div className="setup-meta">
            <span>{workspace.name}</span>
            <span>
              {setup.hasBuiltInGrinder
                ? "Built-in grinder"
                : setup.grinder
                  ? "Separate grinder"
                  : "Add a grinder"}
            </span>
          </div>
        </div>
        <Icon name="arrow" />
      </button>

      <SectionHeading
        title="Active beans"
        action="View all"
        onAction={onBeans}
      />
      {activeBean && (
        <button className="bean-feature-card" onClick={onBean}>
          <div className="bean-art">
            <span className="bean-shape bean-shape-one" />
            <span className="bean-shape bean-shape-two" />
            <span className="bean-origin">
              {activeBean.origin?.split(",")[0] || "Coffee"}
            </span>
          </div>
          <div className="bean-feature-copy">
            <span className="pill">
              {activeBean.roastLevel || "Unknown"} roast
            </span>
            <h3>{activeBean.name}</h3>
            <p>{activeBean.roaster || "Roaster not set"}</p>
            {activeBean.flavorNotes && (
              <p className="flavor-notes">{activeBean.flavorNotes}</p>
            )}
            {activeBean.recipe && (
              <div className="recipe-line">
                <span>
                  <b>{activeBean.recipe.dose}g</b> in
                </span>
                <span className="recipe-arrow">→</span>
                <span>
                  <b>{activeBean.recipe.yield}g</b> out
                </span>
                <span>{activeBean.recipe.extractionTime}s</span>
              </div>
            )}
          </div>
        </button>
      )}

      <SectionHeading
        title="Last shot"
        action={recentShot ? "View all" : undefined}
        onAction={onShots}
      />
      {recentShot && (
        <article className="recent-card">
          <div className="score score-4">
            <strong>{ratio(recentShot.dose, recentShot.yield)}</strong>
            <span>RATIO</span>
          </div>
          <div className="recent-copy">
            <div className="recent-heading">
              <h3>{recentBean?.name || "Saved bean"}</h3>
              <span>{shortDate(recentShot.createdAt)}</span>
            </div>
            <div className="shot-stats">
              <span>
                <Icon name="shot" size={17} />
                {recentShot.dose} → {recentShot.yield}g
              </span>
              <span>
                <Icon name="clock" size={17} />
                {recentShot.extractionTime}s
              </span>
              {recentShot.waterTemperature && (
                <span>
                  <Icon name="thermometer" size={17} />
                  {recentShot.waterTemperature}°
                </span>
              )}
            </div>
            {recentShot.notes && <p>“{recentShot.notes}”</p>}
          </div>
        </article>
      )}

      <p className="footer-note">Brew slowly. Notice everything.</p>
    </div>
  );
}

function OnboardingScreen({ onSave }) {
  return (
    <div className="screen onboarding-screen">
      <div className="onboarding-brand">
        <span className="brand-mark">
          <span />
        </span>
        <span>COFFEE LAB</span>
      </div>
      <p className="eyebrow">WELCOME TO YOUR WORKBENCH</p>
      <h1>Let’s set up your coffee space.</h1>
      <p className="onboarding-intro">
        A few details now will make every dial-in feel like yours.
      </p>
      <ProfileSetupForm onSave={onSave} submitLabel="Start dialing in" />
    </div>
  );
}

function ProfileScreen({ profile, onBack, onSave }) {
  return (
    <div className="screen form-screen">
      <PageHeader
        eyebrow="YOUR PROFILE"
        title="Personal profile"
        description="Keep your name and coffee preferences up to date."
        onBack={onBack}
      />
      <ProfileSetupForm
        initialValues={{
          fullName: profile.fullName,
          ...tasteHabitDefaults,
          ...profile.tasteHabits,
        }}
        onSave={onSave}
        sections={["profile", "taste"]}
        submitLabel="Save profile"
      />
    </div>
  );
}

function MachineScreen({ setup, onBack, onSave }) {
  return (
    <div className="screen form-screen">
      <PageHeader
        eyebrow="ESPRESSO MACHINE"
        title="Your machine"
        description="Change the machine type or its grinder configuration."
        onBack={onBack}
      />
      <ProfileSetupForm
        initialValues={{
          machine: setup.machine,
          hasBuiltInGrinder: setup.hasBuiltInGrinder,
          grinder: setup.hasBuiltInGrinder ? "" : setup.grinder,
        }}
        allowMissingGrinder
        machineLabel="Machine name or type"
        onSave={onSave}
        sections={["machine"]}
        submitLabel="Save machine"
      />
    </div>
  );
}

function SetupScreen({ workspace, setup, onBack, onSave }) {
  return (
    <div className="screen form-screen">
      <PageHeader
        eyebrow="YOUR WORKBENCH"
        title="Setup & equipment"
        description="Manage the machine, grinder, and tools in your current coffee setup."
        onBack={onBack}
      />
      <ProfileSetupForm
        initialValues={{
          machine: setup.machine,
          workspaceName: workspace.name,
          hasBuiltInGrinder: setup.hasBuiltInGrinder,
          grinder: setup.hasBuiltInGrinder ? "" : setup.grinder,
          ...optionalSetupDefaults,
          ...workspace.setupDetails,
        }}
        allowMissingGrinder
        machineLabel="Machine name or type"
        onSave={onSave}
        sections={["workspace", "machine", "equipment"]}
        submitLabel="Save setup"
      />
    </div>
  );
}

function ProfileSetupForm({
  initialValues = {
    fullName: "",
    machine: "",
    workspaceName: "",
    hasBuiltInGrinder: false,
    grinder: "",
    ...optionalSetupDefaults,
    ...tasteHabitDefaults,
  },
  allowMissingGrinder = false,
  machineLabel = "Espresso machine",
  onSave,
  sections = ["profile", "machine", "workspace"],
  submitLabel,
}) {
  const [form, setForm] = useState(initialValues);
  const basicFields = (
    <div className="form-card">
      {sections.includes("profile") && (
        <Field
          label="Full name"
          value={form.fullName}
          onChange={(fullName) => setForm({ ...form, fullName })}
        />
      )}
      {sections.includes("machine") && (
        <>
          <Field
            label={machineLabel}
            value={form.machine}
            onChange={(machine) => setForm({ ...form, machine })}
          />
          {sections.includes("workspace") && (
            <Field
              label="Workspace name"
              value={form.workspaceName}
              placeholder="Home setup"
              required={false}
              onChange={(workspaceName) =>
                setForm({ ...form, workspaceName })
              }
            />
          )}
          <ToggleField
            label="My machine has a built-in grinder"
            checked={form.hasBuiltInGrinder}
            onChange={(hasBuiltInGrinder) =>
              setForm({ ...form, hasBuiltInGrinder })
            }
          />
          {!form.hasBuiltInGrinder && (
            <Field
              label="Grinder name"
              value={form.grinder}
              placeholder={
                allowMissingGrinder ? "Add a separate grinder" : undefined
              }
              required={!allowMissingGrinder}
              onChange={(grinder) => setForm({ ...form, grinder })}
            />
          )}
        </>
      )}
      {sections.includes("workspace") && !sections.includes("machine") && (
        <Field
          label="Workspace name"
          value={form.workspaceName}
          placeholder="Home setup"
          required={false}
          onChange={(workspaceName) => setForm({ ...form, workspaceName })}
        />
      )}
    </div>
  );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(form);
      }}
    >
      {(sections.includes("profile") ||
        sections.includes("workspace") ||
        sections.includes("machine")) &&
        basicFields}
      {sections.includes("equipment") && (
        <>
          <FormSectionHeading
            title="Equipment details"
            subtitle="Optional details can make shot logging quicker and recommendations more relevant."
          />
          <div className="form-card">
            <Field
              label="Basket size"
              value={form.basketSize}
              type="number"
              min="7"
              max="25"
              suffix="g"
              required={false}
              onChange={(basketSize) => setForm({ ...form, basketSize })}
            />
            <Field
              label="Default dose"
              value={form.defaultDose}
              type="number"
              min="5"
              max="25"
              suffix="g"
              required={false}
              onChange={(defaultDose) => setForm({ ...form, defaultDose })}
            />
            <Field
              label="Default water temperature"
              value={form.defaultWaterTemperature}
              type="number"
              min="85"
              max="100"
              suffix="°C"
              required={false}
              onChange={(defaultWaterTemperature) =>
                setForm({ ...form, defaultWaterTemperature })
              }
            />
            <SelectField
              label="Portafilter type"
              value={form.portafilterType}
              options={[
                "Single",
                "Double",
                "Bottomless",
                "Pressurized",
              ]}
              optional
              onChange={(portafilterType) =>
                setForm({ ...form, portafilterType })
              }
            />
            <SelectField
              label="Puck screen"
              value={form.puckScreen}
              options={["Yes", "No"]}
              optional
              onChange={(puckScreen) => setForm({ ...form, puckScreen })}
            />
            <SelectField
              label="WDT"
              value={form.wdt}
              options={["Yes", "No"]}
              optional
              onChange={(wdt) => setForm({ ...form, wdt })}
            />
            <SelectField
              label="Distribution tool"
              value={form.distributionTool}
              options={["Yes", "No"]}
              optional
              onChange={(distributionTool) =>
                setForm({ ...form, distributionTool })
              }
            />
            <SelectField
              label="Tamper type"
              value={form.tamperType}
              options={["Standard", "Calibrated", "Self-leveling"]}
              optional
              onChange={(tamperType) => setForm({ ...form, tamperType })}
            />
          </div>
        </>
      )}
      {sections.includes("taste") && (
        <>
          <FormSectionHeading
            title="Taste & habits"
            subtitle="These preferences help Coffee Lab understand how you like to drink coffee."
          />
          <div className="form-card">
            <SelectField
              label="Main drink style"
              value={form.mainDrinkStyle}
              options={["Espresso", "Americano", "Milk drinks", "All"]}
              optional
              onChange={(mainDrinkStyle) =>
                setForm({ ...form, mainDrinkStyle })
              }
            />
            <SelectField
              label="Experience level"
              value={form.experienceLevel}
              options={["Beginner", "Intermediate", "Advanced"]}
              optional
              onChange={(experienceLevel) =>
                setForm({ ...form, experienceLevel })
              }
            />
            <SelectField
              label="Preferred roast"
              value={form.preferredRoast}
              options={[...beanRoastLevels, "No preference"]}
              optional
              onChange={(preferredRoast) =>
                setForm({ ...form, preferredRoast })
              }
            />
            <SelectField
              label="Preferred taste direction"
              value={form.preferredTasteDirection}
              options={[
                "Sweet",
                "Balanced",
                "Bright",
                "Chocolatey",
                "Fruity",
                "Intense",
              ]}
              optional
              onChange={(preferredTasteDirection) =>
                setForm({ ...form, preferredTasteDirection })
              }
            />
          </div>
        </>
      )}
      <FormSubmit label={submitLabel} />
    </form>
  );
}

function BeansScreen({ beans, onBack, onAdd, onSelect }) {
  return (
    <div className="screen">
      <PageHeader
        eyebrow="YOUR COFFEE SHELF"
        title="Beans"
        description="Keep every coffee and its shots together."
        onBack={onBack}
      />
      <button className="primary-button add-bean-button" onClick={onAdd}>
        <span className="button-icon">
          <Icon name="plus" />
        </span>
        <strong>Add bean</strong>
        <Icon name="arrow" />
      </button>
      <div className="bean-list">
        {beans.map((bean, index) => (
          <button
            className={`bean-list-card bean-tone-${index + 1}`}
            key={bean.id}
            onClick={() => onSelect(bean.id)}
          >
            <div className="bean-list-art">
              <span className="mini-bean" />
            </div>
            <div className="bean-list-copy">
              <div>
                {bean.active && <span className="active-dot">ACTIVE</span>}
                <h3>{bean.name}</h3>
                <p>
                  {[bean.roaster, bean.origin].filter(Boolean).join(" · ") ||
                    "Bean details not set"}
                </p>
              </div>
              <div className="bean-list-bottom">
                <span>
                  {bean.flavorNotes ||
                    `${bean.roastLevel || "Unknown"} roast`}
                </span>
                <Icon name="arrow" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function BeanDetailScreen({
  bean,
  shots,
  onBack,
  onEdit,
  onActivate,
  onShot,
}) {
  return (
    <div className="screen detail-screen">
      <button
        className="back-button floating-back"
        onClick={onBack}
        aria-label="Back to beans"
      >
        <Icon name="back" />
      </button>
      <section className="bean-detail-hero">
        <div className="bean-detail-art">
          <span className="large-bean" />
          <span className="origin-stamp">
            {bean.origin?.split(",")[0] || "Coffee"}
          </span>
        </div>
        <span className="pill">{bean.roastLevel || "Unknown"} roast</span>
        <h1>{bean.name}</h1>
        {bean.roaster && <p className="bean-roaster">{bean.roaster}</p>}
        {bean.flavorNotes && (
          <p className="bean-flavors">{bean.flavorNotes}</p>
        )}
      </section>

      <div className="detail-actions">
        {!bean.active && (
          <button className="secondary-button" onClick={onActivate}>
            <Icon name="check" />
            Make active
          </button>
        )}
        <button className="secondary-button" onClick={onEdit}>
          <Icon name="edit" />
          Edit bean
        </button>
      </div>

      <section className="bean-info-card">
        <p className="eyebrow">BEAN INFO</p>
        <div className="bean-info-grid">
          <BeanInfo label="Roaster" value={bean.roaster} />
          <BeanInfo label="Origin" value={bean.origin} />
          <BeanInfo label="Process" value={bean.process} />
          <BeanInfo label="Roast" value={bean.roastLevel} />
        </div>
        {bean.notes && <p className="bean-notes">{bean.notes}</p>}
      </section>

      <button className="primary-button sticky-action" onClick={onShot}>
        <span className="button-icon">
          <Icon name="plus" />
        </span>
        <strong>Add a shot</strong>
        <Icon name="arrow" />
      </button>

      <SectionHeading title="Shot log" />
      <ShotList shots={shots} emptyMessage="No shots logged for this bean yet." />
    </div>
  );
}

function BeanFormScreen({ bean, onBack, onSave }) {
  const [form, setForm] = useState({
    name: "",
    roaster: "",
    roastLevel: "Unknown",
    origin: "",
    process: "",
    flavorNotes: "",
    notes: "",
    ...bean,
  });
  const roastOptions = roastLevels.includes(form.roastLevel)
    ? roastLevels
    : [form.roastLevel, ...roastLevels];

  return (
    <FormScreen
      eyebrow="BEAN PROFILE"
      title={bean ? "Edit bean" : "Add bean"}
      description="A name is enough to start. Add anything else you know."
      onBack={onBack}
      onSubmit={(event) => {
        event.preventDefault();
        onSave(form);
      }}
      submitLabel={bean ? "Save bean" : "Add bean"}
    >
      <div className="form-card">
        <Field
          label="Bean name"
          value={form.name}
          onChange={(name) => setForm({ ...form, name })}
        />
        <Field
          label="Roaster"
          value={form.roaster}
          required={false}
          onChange={(roaster) => setForm({ ...form, roaster })}
        />
        <SelectField
          label="Roast level"
          value={form.roastLevel}
          options={roastOptions}
          onChange={(roastLevel) => setForm({ ...form, roastLevel })}
        />
        <Field
          label="Origin"
          value={form.origin}
          required={false}
          onChange={(origin) => setForm({ ...form, origin })}
        />
        <Field
          label="Process"
          value={form.process}
          required={false}
          onChange={(process) => setForm({ ...form, process })}
        />
        <Field
          label="Tasting notes"
          value={form.flavorNotes}
          required={false}
          onChange={(flavorNotes) => setForm({ ...form, flavorNotes })}
        />
      </div>
      <label className="textarea-field bean-notes-field">
        <span>Notes</span>
        <textarea
          placeholder="Anything useful to remember"
          value={form.notes}
          onChange={(event) => setForm({ ...form, notes: event.target.value })}
        />
      </label>
    </FormScreen>
  );
}

function ShotScreen({ bean, workspace, onBack, onSave }) {
  const base = bean.recipe || {};
  const setupDetails = workspace.setupDetails || {};
  const [form, setForm] = useState({
    dose: base.dose || setupDetails.defaultDose || "",
    yield: base.yield || "",
    extractionTime: base.extractionTime || "",
    waterTemperature:
      base.waterTemperature || setupDetails.defaultWaterTemperature || "",
    grindSize: base.grindSize || "",
    taste: "",
    flow: "Normal",
    notes: "",
  });

  return (
    <div className="screen shot-screen">
      <PageHeader
        eyebrow="SHOT IN PROGRESS"
        title={bean.name}
        description={`Log the essentials now. Add tasting details if useful.`}
        onBack={onBack}
      />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave({
            ...form,
            dose: Number(form.dose),
            yield: Number(form.yield),
            extractionTime: Number(form.extractionTime),
            waterTemperature: form.waterTemperature
              ? Number(form.waterTemperature)
              : "",
          });
        }}
      >
        <div className="form-card compact-card">
          <div className="field-row">
            <Field
              label="Dose in"
              type="number"
              step="0.1"
              min="1"
              value={form.dose}
              suffix="g"
              onChange={(dose) => setForm({ ...form, dose })}
            />
            <Field
              label="Yield out"
              type="number"
              step="0.1"
              min="1"
              value={form.yield}
              suffix="g"
              onChange={(yieldValue) =>
                setForm({ ...form, yield: yieldValue })
              }
            />
          </div>
          <div className="inline-ratio">
            Brew ratio <strong>{ratio(form.dose, form.yield)}</strong>
          </div>
          <Field
            label="Extraction time"
            type="number"
            min="1"
            value={form.extractionTime}
            suffix="sec"
            onChange={(extractionTime) =>
              setForm({ ...form, extractionTime })
            }
          />
          <div className="field-row">
            <Field
              label="Grind setting"
              value={form.grindSize}
              required={false}
              onChange={(grindSize) => setForm({ ...form, grindSize })}
            />
            <Field
              label="Temperature"
              type="number"
              min="70"
              max="105"
              value={form.waterTemperature}
              suffix="°C"
              required={false}
              onChange={(waterTemperature) =>
                setForm({ ...form, waterTemperature })
              }
            />
          </div>
        </div>

        <TasteSelector
          label="Taste result (optional)"
          options={tastes}
          value={form.taste}
          onChange={(taste) => setForm({ ...form, taste })}
        />

        <label className="textarea-field">
          <span>Notes</span>
          <textarea
            placeholder="What stood out?"
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
        </label>

        <button className="primary-button form-submit" type="submit">
          <span className="button-icon">
            <Icon name="check" />
          </span>
          <strong>Save & analyze shot</strong>
          <Icon name="arrow" />
        </button>
      </form>
    </div>
  );
}

function ShotLogScreen({ shots, beans, onBack, onSelectBean }) {
  return (
    <div className="screen">
      <PageHeader
        eyebrow="BREW HISTORY"
        title="Shot log"
        description="Every saved shot, with the bean you used."
        onBack={onBack}
      />
      <ShotList
        shots={shots}
        getBean={(beanId) => beans.find((bean) => bean.id === beanId)}
        onSelectBean={onSelectBean}
        emptyMessage="No shots logged yet."
      />
    </div>
  );
}

function ShotList({
  shots,
  getBean,
  onSelectBean,
  emptyMessage,
}) {
  if (!shots.length) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  return (
    <div className="shot-log">
      {shots.map((shot) => {
        const bean = getBean?.(shot.beanId);
        const content = (
          <>
            <div className="shot-log-top">
              <div>
                {bean && <span>{bean.name}</span>}
                <strong>
                  {shot.dose}g → {shot.yield}g
                </strong>
              </div>
              <time>{shortDate(shot.createdAt)}</time>
            </div>
            <div className="shot-log-meta">
              <span>{shot.extractionTime}s</span>
              <span>{ratio(shot.dose, shot.yield)}</span>
              {shot.grindSize && <span>Grind {shot.grindSize}</span>}
              {shot.waterTemperature && (
                <span>{shot.waterTemperature}°C</span>
              )}
              {shot.taste && <span>{shot.taste}</span>}
            </div>
            {shot.notes && <p>{shot.notes}</p>}
          </>
        );

        return onSelectBean && bean ? (
          <button
            className="shot-log-card"
            key={shot.id}
            onClick={() => onSelectBean(bean.id)}
          >
            {content}
          </button>
        ) : (
          <article className="shot-log-card" key={shot.id}>
            {content}
          </article>
        );
      })}
    </div>
  );
}

function BeanInfo({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value || "Not set"}</strong>
    </div>
  );
}

function RecommendationScreen({ shot, bean, onDone, onAgain }) {
  const recommendation = shot.recommendation;
  return (
    <div className="screen recommendation-screen">
      <div className="recommendation-top">
        <div className={`recommendation-icon direction-${recommendation.direction}`}>
          <Icon name="spark" size={30} />
        </div>
        <p className="eyebrow">NEXT SHOT</p>
        <h1>{recommendation.action}</h1>
        <p>{recommendation.detail}</p>
      </div>

      <section className="adjustment-card">
        <div className="adjustment-card-top">
          <span>SHOT SAVED</span>
          <span>{bean.name}</span>
        </div>
        <div className="result-ratio">
          <span>{shot.dose}g</span>
          <i />
          <strong>{ratio(shot.dose, shot.yield)}</strong>
          <i />
          <span>{shot.yield}g</span>
        </div>
        <div className="result-meta">
          <span>{shot.extractionTime} seconds</span>
          {shot.waterTemperature && <span>{shot.waterTemperature}°C</span>}
          {shot.grindSize && <span>Grind {shot.grindSize}</span>}
        </div>
        {(shot.taste || shot.flow || shot.rating) && (
          <div className="taste-result">
            {shot.taste && <span>{shot.taste}</span>}
            {shot.flow && <span>{shot.flow}</span>}
            {shot.rating && <span>{shot.rating}/5</span>}
          </div>
        )}
      </section>

      <div className="why-card">
        <span className="why-number">01</span>
        <div>
          <strong>Change one thing</strong>
          <p>
            Keep dose, temperature, and puck prep steady so the next cup gives
            you a clean signal.
          </p>
        </div>
      </div>

      <button className="primary-button" onClick={onAgain}>
        <span className="button-icon">
          <Icon name="shot" />
        </span>
        <strong>Pull the next shot</strong>
        <Icon name="arrow" />
      </button>
      <button className="text-button" onClick={onDone}>
        Back to home
      </button>
    </div>
  );
}

function FormScreen({
  eyebrow,
  title,
  description,
  onBack,
  onSubmit,
  submitLabel,
  children,
}) {
  return (
    <div className="screen form-screen">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        onBack={onBack}
      />
      <form onSubmit={onSubmit}>
        {children}
        <FormSubmit label={submitLabel} />
      </form>
    </div>
  );
}

function FormSubmit({ label }) {
  return (
    <button className="primary-button form-submit" type="submit">
      <span className="button-icon">
        <Icon name="check" />
      </span>
      <strong>{label}</strong>
      <Icon name="arrow" />
    </button>
  );
}

function PageHeader({ eyebrow, title, description, onBack }) {
  return (
    <header className="page-header">
      <button className="back-button" onClick={onBack} aria-label="Go back">
        <Icon name="back" />
      </button>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}

function BottomNav({ screen, navigate }) {
  const items = [
    ["home", "Home", "home"],
    ["beans", "Beans", "beans"],
    ["shot", "Shot", "shot"],
    ["setup", "Setup", "setup"],
  ];
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {items.map(([target, label, icon]) => {
        const active =
          screen === target ||
          (screen === "bean" && target === "beans") ||
          (screen === "machine" && target === "setup");
        return (
          <button
            key={target}
            className={active ? "active" : ""}
            onClick={() => navigate(target)}
          >
            <Icon name={icon} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function SectionHeading({ title, action, onAction }) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      {action && <button onClick={onAction}>{action}</button>}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  suffix,
  step,
  placeholder,
  required = true,
  min,
  max,
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-wrap">
        <input
          required={required}
          type={type}
          step={step}
          min={min}
          max={max}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix && <i>{suffix}</i>}
      </div>
    </label>
  );
}

function SelectField({ label, value, options, onChange, optional = false }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-wrap select-wrap">
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {optional && <option value="">Not set</option>}
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </div>
    </label>
  );
}

function FormSectionHeading({ title, subtitle }) {
  return (
    <div className="form-section-heading">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}

function ToggleField({ label, checked, onChange }) {
  return (
    <label className="toggle-field">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <i>
        <b />
      </i>
    </label>
  );
}

function TasteSelector({ label, options, value, onChange }) {
  return (
    <fieldset className="taste-selector">
      <legend>{label}</legend>
      <div>
        {options.map((option) => (
          <button
            type="button"
            className={value === option ? "selected" : ""}
            onClick={() => onChange(option)}
            key={option}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default App;
