import ReactHabitat from "react-habitat";
import PrunnerUi from "./PrunnerUi";

class Bootstrap extends ReactHabitat.Bootstrapper {
  constructor() {
    super();

    // Create a new container builder:
    const builder = new ReactHabitat.ContainerBuilder();

    // Register a component:
    builder.register(PrunnerUi).as("PrunnerUi").withOptions({className: "prunner-ui"});

    // Finally, set the container:
    this.setContainer(builder.build());
  }
}

export default new Bootstrap();
