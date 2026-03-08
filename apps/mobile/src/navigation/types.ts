export type RootStackParamList = {
    Login: undefined;
    AppTabs: undefined;
    PromptDetail: { promptId: string };
    PromptUpload: { promptId: string };
    EntryDetail: { completionId: string };
};

export type AppTabParamList = {
    Home: undefined;
    Feed: undefined;
    Friends: undefined;
    Archive: undefined;
    Settings: undefined;
};
