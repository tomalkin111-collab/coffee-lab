import { useEffect, useMemo, useState } from "react";
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

const roastLevels = ["Light", "Medium-light", "Medium", "Medium-dark", "Dark"];
const tastes = ["Sour", "Bitter", "Watery", "Weak", "Balanced"];
const flows = ["Too fast", "Normal", "Too slow"];
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

  function updateProfileSetup(form) {
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

  function updateBean(bean) {
    setData((current) => ({
      ...current,
      beans: current.beans.map((item) => (item.id === bean.id ? bean : item)),
    }));
    setSelectedBeanId(bean.id);
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
      id: `shot-${Date.now()}`,
      createdAt: new Date().toISOString(),
      beanId: selectedBean.id,
      recommendation: getRecommendation(shot),
    };

    setData((current) => ({
      ...current,
      shots: [savedShot, ...current.shots],
      beans: current.beans.map((bean) =>
        bean.id === selectedBean.id
          ? {
              ...bean,
              recipe: {
                dose: Number(shot.dose),
                yield: Number(shot.yield),
                extractionTime: Number(shot.extractionTime),
                waterTemperature: Number(shot.waterTemperature),
                grindSize: shot.grindSize,
                grinderTime: Number(shot.grinderTime),
                basket: shot.basket,
                portafilter: shot.portafilter,
                puckScreen: shot.puckScreen,
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
          <OnboardingScreen onSave={updateProfileSetup} />
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
            onSetup={() => navigate("setup")}
            onBeans={() => navigate("beans")}
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
        {screen === "setup" && (
          <SetupScreen
            profile={data.profile}
            workspace={data.workspace}
            setup={data.setup}
            onBack={() => navigate("home")}
            onSave={updateProfileSetup}
          />
        )}
        {screen === "beans" && (
          <BeansScreen
            beans={data.beans}
            onBack={() => navigate("home")}
            onSelect={(id) => {
              setSelectedBeanId(id);
              navigate("bean");
            }}
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
            setup={data.setup}
            onBack={() => navigate("bean")}
            onSave={updateBean}
          />
        )}
        {screen === "shot" && selectedBean && (
          <ShotScreen
            bean={selectedBean}
            setup={data.setup}
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

      {!["shot", "recommendation", "editBean"].includes(screen) && (
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
  onSetup,
  onBeans,
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
        <button className="avatar" onClick={onSetup} aria-label="Open setup">
          {initials(profile.fullName)}
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
      <button className="setup-card" onClick={onSetup}>
        <div className="machine-illustration">
          <div className="machine-top" />
          <div className="machine-face">
            <span />
            <span />
          </div>
          <div className="machine-group" />
          <div className="machine-cup" />
        </div>
        <div className="setup-copy">
          <span className="status-label">
            <i /> READY
          </span>
          <h3>{setup.machine}</h3>
          <p>{setup.grinder}</p>
          <div className="setup-meta">
            <span>{workspace.name}</span>
            <span>
              {setup.hasBuiltInGrinder
                ? "Built-in grinder"
                : "Separate grinder"}
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
            <span className="bean-origin">{activeBean.origin.split(",")[0]}</span>
          </div>
          <div className="bean-feature-copy">
            <span className="pill">{activeBean.roastLevel} roast</span>
            <h3>{activeBean.name}</h3>
            <p>{activeBean.roaster}</p>
            <p className="flavor-notes">{activeBean.flavorNotes}</p>
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
          </div>
        </button>
      )}

      <SectionHeading title="Last shot" />
      {recentShot && (
        <article className="recent-card">
          <div className={`score score-${recentShot.rating}`}>
            <strong>{recentShot.rating}.0</strong>
            <span>GREAT</span>
          </div>
          <div className="recent-copy">
            <div className="recent-heading">
              <h3>{activeBean?.name}</h3>
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
              <span>
                <Icon name="thermometer" size={17} />
                {recentShot.waterTemperature}°
              </span>
            </div>
            <p>“{recentShot.notes}”</p>
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

function SetupScreen({ profile, workspace, setup, onBack, onSave }) {
  return (
    <div className="screen form-screen">
      <PageHeader
        eyebrow="YOUR WORKBENCH"
        title="Profile & setup"
        description="Keep your name and everyday espresso setup up to date."
        onBack={onBack}
      />
      <ProfileSetupForm
        initialValues={{
          fullName: profile.fullName,
          machine: setup.machine,
          workspaceName: workspace.name,
          hasBuiltInGrinder: setup.hasBuiltInGrinder,
          grinder: setup.hasBuiltInGrinder ? "" : setup.grinder,
          ...optionalSetupDefaults,
          ...workspace.setupDetails,
          ...tasteHabitDefaults,
          ...profile.tasteHabits,
        }}
        onSave={onSave}
        submitLabel="Save changes"
        showOptional
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
  onSave,
  submitLabel,
  showOptional = false,
}) {
  const [form, setForm] = useState(initialValues);
  const basicFields = (
    <div className="form-card">
      <Field
        label="Full name"
        value={form.fullName}
        onChange={(fullName) => setForm({ ...form, fullName })}
      />
      <Field
        label="Espresso machine"
        value={form.machine}
        onChange={(machine) => setForm({ ...form, machine })}
      />
      <Field
        label="Workspace name"
        value={form.workspaceName}
        placeholder="Home setup"
        required={false}
        onChange={(workspaceName) => setForm({ ...form, workspaceName })}
      />
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
          onChange={(grinder) => setForm({ ...form, grinder })}
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
      {basicFields}
      {showOptional && (
        <>
          <FormSectionHeading
            title="Optional setup details"
            subtitle="Add more equipment details for better recommendations."
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

          <FormSectionHeading
            title="Taste & habits"
            subtitle="Help Coffee Lab understand how you like to drink coffee."
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
              options={["Light", "Medium", "Dark", "No preference"]}
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
      <button className="primary-button form-submit" type="submit">
        <span className="button-icon">
          <Icon name="check" />
        </span>
        <strong>{submitLabel}</strong>
        <Icon name="arrow" />
      </button>
    </form>
  );
}

function BeansScreen({ beans, onBack, onSelect }) {
  return (
    <div className="screen">
      <PageHeader
        eyebrow="YOUR COFFEE SHELF"
        title="Beans"
        description="Two coffees, two different puzzles."
        onBack={onBack}
      />
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
                  {bean.roaster} · {bean.origin}
                </p>
              </div>
              <div className="bean-list-bottom">
                <span>{bean.flavorNotes}</span>
                <Icon name="arrow" />
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="soft-note">
        <Icon name="spark" />
        <p>
          For this focused MVP, edit the sample beans and recipes to make them
          yours.
        </p>
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
          <span className="origin-stamp">{bean.origin.split(",")[0]}</span>
        </div>
        <span className="pill">{bean.roastLevel} roast</span>
        <h1>{bean.name}</h1>
        <p className="bean-roaster">{bean.roaster}</p>
        <p className="bean-flavors">{bean.flavorNotes}</p>
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

      <section className="recipe-card">
        <div className="recipe-card-heading">
          <div>
            <p className="eyebrow">CURRENT RECIPE</p>
            <h2>{ratio(bean.recipe.dose, bean.recipe.yield)}</h2>
          </div>
          <span className="recipe-status">DIALED IN</span>
        </div>
        <div className="recipe-grid">
          <RecipeStat label="Dose" value={`${bean.recipe.dose}g`} />
          <RecipeStat label="Yield" value={`${bean.recipe.yield}g`} />
          <RecipeStat label="Time" value={`${bean.recipe.extractionTime}s`} />
          <RecipeStat
            label="Temperature"
            value={`${bean.recipe.waterTemperature}°C`}
          />
          <RecipeStat label="Grind" value={bean.recipe.grindSize} />
          <RecipeStat label="Grinder" value={`${bean.recipe.grinderTime}s`} />
        </div>
        <div className="recipe-equipment">
          {bean.recipe.basket} · {bean.recipe.portafilter} · Puck screen{" "}
          {bean.recipe.puckScreen ? "on" : "off"}
        </div>
      </section>

      <div className="bean-facts">
        <div>
          <span>ROASTED</span>
          <strong>{shortDate(bean.roastDate)}</strong>
        </div>
        <div>
          <span>BEST AS</span>
          <strong>{bean.drinkingStyle}</strong>
        </div>
        <div>
          <span>SHOTS</span>
          <strong>{shots.length}</strong>
        </div>
      </div>

      <button className="primary-button sticky-action" onClick={onShot}>
        <span className="button-icon">
          <Icon name="plus" />
        </span>
        <strong>Add a shot</strong>
        <Icon name="arrow" />
      </button>
    </div>
  );
}

function BeanFormScreen({ bean, setup, onBack, onSave }) {
  const [form, setForm] = useState(bean);

  function updateRecipe(key, value) {
    setForm({ ...form, recipe: { ...form.recipe, [key]: value } });
  }

  return (
    <FormScreen
      eyebrow="BEAN PROFILE"
      title="Edit coffee"
      description="Keep the character of the coffee and its working recipe together."
      onBack={onBack}
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          ...form,
          recipe: {
            ...form.recipe,
            dose: Number(form.recipe.dose),
            yield: Number(form.recipe.yield),
            extractionTime: Number(form.recipe.extractionTime),
            waterTemperature: Number(form.recipe.waterTemperature),
            grinderTime: Number(form.recipe.grinderTime),
          },
        });
      }}
      submitLabel="Save bean"
    >
      <p className="form-section-label">Coffee</p>
      <div className="form-card">
        <Field
          label="Bean name"
          value={form.name}
          onChange={(name) => setForm({ ...form, name })}
        />
        <Field
          label="Roaster"
          value={form.roaster}
          onChange={(roaster) => setForm({ ...form, roaster })}
        />
        <Field
          label="Origin"
          value={form.origin}
          onChange={(origin) => setForm({ ...form, origin })}
        />
        <SelectField
          label="Roast level"
          value={form.roastLevel}
          options={roastLevels}
          onChange={(roastLevel) => setForm({ ...form, roastLevel })}
        />
        <Field
          label="Roast date"
          type="date"
          value={form.roastDate}
          onChange={(roastDate) => setForm({ ...form, roastDate })}
        />
        <Field
          label="Flavor notes"
          value={form.flavorNotes}
          onChange={(flavorNotes) => setForm({ ...form, flavorNotes })}
        />
        <SelectField
          label="Recommended style"
          value={form.drinkingStyle}
          options={["Espresso", "Americano", "Flat white", "Cappuccino"]}
          onChange={(drinkingStyle) => setForm({ ...form, drinkingStyle })}
        />
      </div>

      <p className="form-section-label">Current recipe</p>
      <div className="form-card">
        <div className="field-row">
          <Field
            label="Dose"
            value={form.recipe.dose}
            type="number"
            suffix="g"
            onChange={(value) => updateRecipe("dose", value)}
          />
          <Field
            label="Yield"
            value={form.recipe.yield}
            type="number"
            suffix="g"
            onChange={(value) => updateRecipe("yield", value)}
          />
        </div>
        <div className="inline-ratio">
          Brew ratio{" "}
          <strong>{ratio(form.recipe.dose, form.recipe.yield)}</strong>
        </div>
        <div className="field-row">
          <Field
            label="Time"
            value={form.recipe.extractionTime}
            type="number"
            suffix="sec"
            onChange={(value) => updateRecipe("extractionTime", value)}
          />
          <Field
            label="Temperature"
            value={form.recipe.waterTemperature}
            type="number"
            suffix="°C"
            onChange={(value) => updateRecipe("waterTemperature", value)}
          />
        </div>
        <div className="field-row">
          <Field
            label="Grind size"
            value={form.recipe.grindSize}
            onChange={(value) => updateRecipe("grindSize", value)}
          />
          <Field
            label="Grinder time"
            value={form.recipe.grinderTime}
            type="number"
            step="0.1"
            suffix="sec"
            onChange={(value) => updateRecipe("grinderTime", value)}
          />
        </div>
        <Field
          label="Basket"
          value={form.recipe.basket || setup.basket}
          onChange={(value) => updateRecipe("basket", value)}
        />
        <SelectField
          label="Portafilter"
          value={form.recipe.portafilter || setup.portafilter}
          options={["Bottomless", "Double spout", "Single spout"]}
          onChange={(value) => updateRecipe("portafilter", value)}
        />
        <ToggleField
          label="Use a puck screen"
          checked={form.recipe.puckScreen}
          onChange={(value) => updateRecipe("puckScreen", value)}
        />
      </div>
    </FormScreen>
  );
}

function ShotScreen({ bean, setup, onBack, onSave }) {
  const base = bean.recipe;
  const [form, setForm] = useState({
    dose: base.dose,
    yield: base.yield,
    extractionTime: base.extractionTime,
    waterTemperature: base.waterTemperature || setup.waterTemperature,
    grindSize: base.grindSize,
    grinderTime: base.grinderTime,
    basket: base.basket || setup.basket,
    portafilter: base.portafilter || setup.portafilter,
    puckScreen: base.puckScreen ?? setup.puckScreen,
    taste: "Balanced",
    flow: "Normal",
    notes: "",
    rating: 4,
  });

  return (
    <div className="screen shot-screen">
      <PageHeader
        eyebrow="SHOT IN PROGRESS"
        title={bean.name}
        description={`${bean.roaster} · Current ratio ${ratio(form.dose, form.yield)}`}
        onBack={onBack}
      />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave(form);
        }}
      >
        <div className="shot-measurements">
          <NumberDial
            label="Dose in"
            value={form.dose}
            unit="g"
            step={0.1}
            onChange={(dose) => setForm({ ...form, dose })}
          />
          <div className="ratio-orbit">
            <span>RATIO</span>
            <strong>{ratio(form.dose, form.yield)}</strong>
          </div>
          <NumberDial
            label="Yield out"
            value={form.yield}
            unit="g"
            step={0.5}
            onChange={(yieldValue) =>
              setForm({ ...form, yield: yieldValue })
            }
          />
        </div>

        <div className="form-card compact-card">
          <div className="field-row">
            <Field
              label="Extraction time"
              type="number"
              value={form.extractionTime}
              suffix="sec"
              onChange={(extractionTime) =>
                setForm({ ...form, extractionTime })
              }
            />
            <Field
              label="Temperature"
              type="number"
              value={form.waterTemperature}
              suffix="°C"
              onChange={(waterTemperature) =>
                setForm({ ...form, waterTemperature })
              }
            />
          </div>
          <div className="field-row">
            <Field
              label="Grind size"
              value={form.grindSize}
              onChange={(grindSize) => setForm({ ...form, grindSize })}
            />
            <Field
              label="Grinder time"
              type="number"
              step="0.1"
              value={form.grinderTime}
              suffix="sec"
              onChange={(grinderTime) =>
                setForm({ ...form, grinderTime })
              }
            />
          </div>
        </div>

        <TasteSelector
          label="How did it taste?"
          options={tastes}
          value={form.taste}
          onChange={(taste) => setForm({ ...form, taste })}
        />
        <TasteSelector
          label="How was the flow?"
          options={flows}
          value={form.flow}
          onChange={(flow) => setForm({ ...form, flow })}
        />

        <div className="rating-block">
          <label>Your rating</label>
          <div className="rating-row">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                type="button"
                key={rating}
                className={rating <= form.rating ? "rating-on" : ""}
                onClick={() => setForm({ ...form, rating })}
                aria-label={`${rating} out of 5`}
              >
                {rating}
              </button>
            ))}
          </div>
        </div>

        <label className="textarea-field">
          <span>Notes</span>
          <textarea
            placeholder="What stood out?"
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
        </label>

        <details className="equipment-details">
          <summary>Equipment used</summary>
          <div className="form-card compact-card">
            <Field
              label="Basket"
              value={form.basket}
              onChange={(basket) => setForm({ ...form, basket })}
            />
            <SelectField
              label="Portafilter"
              value={form.portafilter}
              options={["Bottomless", "Double spout", "Single spout"]}
              onChange={(portafilter) =>
                setForm({ ...form, portafilter })
              }
            />
            <ToggleField
              label="Puck screen"
              checked={form.puckScreen}
              onChange={(puckScreen) => setForm({ ...form, puckScreen })}
            />
          </div>
        </details>

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
          <span>{shot.waterTemperature}°C</span>
          <span>Grind {shot.grindSize}</span>
        </div>
        <div className="taste-result">
          <span>{shot.taste}</span>
          <span>{shot.flow}</span>
          <span>{shot.rating}/5</span>
        </div>
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
        <button className="primary-button form-submit" type="submit">
          <span className="button-icon">
            <Icon name="check" />
          </span>
          <strong>{submitLabel}</strong>
          <Icon name="arrow" />
        </button>
      </form>
    </div>
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
          screen === target || (screen === "bean" && target === "beans");
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

function RecipeStat({ label, value }) {
  return (
    <div className="recipe-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function NumberDial({ label, value, unit, step, onChange }) {
  const number = Number(value);
  return (
    <div className="number-dial">
      <span>{label}</span>
      <div>
        <button
          type="button"
          onClick={() => onChange(Number((number - step).toFixed(1)))}
        >
          −
        </button>
        <strong>
          {value}
          <i>{unit}</i>
        </strong>
        <button
          type="button"
          onClick={() => onChange(Number((number + step).toFixed(1)))}
        >
          +
        </button>
      </div>
    </div>
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
