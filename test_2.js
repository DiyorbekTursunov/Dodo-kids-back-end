const mainProtsess = {
  id: "process-uuid",
  modelName: "Model 123",
  department: "Bichuv",
  protsesIsOver: false,
  protsesIsStartedTime: new Date().toISOString(),
  protsesIsOverTime: "",

  completedSections: [
    {
      id: "line-uuid-1",
      departmentId: "Ombor-uuid",
      department: "Ombor",
    },
  ],

  line: [
    {
      id: "line-uuid-1",
      protsessIsOver: false,
      department: "Bichuv",
      name: "A1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      qoshilganlarSoni: 1500,
      yuborilganlarSoni: [1000, 1400],
      yaroqsizlarSoni: [
        { soni: 2, sabali: "Torn" },
        { soni: 1, sabali: "Stained" },
      ],
      status: ["Pending", "Qabul qilingan", "Yuborilgan"],
    },
    {
      id: "line-uuid-2",
      protsessIsOver: true,
      department: "Bichuv",
      name: "A2",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      qoshilganlarSoni: [{ soni: 70, name: "Pants" }],
      yuborilganlarSoni: [1000, 1400],
      yaroqsizlarSoni: [],
      status: ["Pending", "Qabul qilingan", "Yuborilgan"],
    },
  ],

  completedLines: [
    {
      id: "line-uuid-2", // same as above (A2 is done)
      protsessIsOver: true,
      department: "Bichuv",
      name: "A2",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      qoshilganlarSoni: [{ soni: 70, name: "Pants" }],
      yuborilganlarSoni: [1000, 1400],
      yaroqsizlarSoni: [],
      status: ["Pending", "Qabul qilingan", "Yuborilgan"],
    },
  ],
};
