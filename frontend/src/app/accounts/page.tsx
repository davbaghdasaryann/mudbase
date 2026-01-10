"use client";

import React, { useEffect, useState } from "react";
import PageContents from "@/components/PageContents";
import { usePermissions } from "../../api/auth";
import { useTranslation } from "react-i18next";
import Env from "@/env";
import { TabContext, TabList } from "@mui/lab";
import { Box } from "@mui/system";
import { Tab } from "@mui/material";
import ActiveAccountsTab from "./ActiveAccountsTab";
import InactiveAccountsTab from "./InactiveAccountsTab";

export default function AccountsPage() {
    const { session, permissionsSet } = usePermissions();
    const { t } = useTranslation();

    type TabValue = "active" | "inactive";

    const defaultTab: TabValue = session?.user && permissionsSet?.has("ACC_FCH")
        ? (Env.isDev ? "active" : "inactive")
        : "inactive";

    const savedTab = typeof window !== "undefined" ? localStorage.getItem("selectedAccountsTab") as TabValue | null : null;


    const [currentTab, setCurrentTab] = useState<TabValue>(savedTab || defaultTab);

    useEffect(() => {
        const storedTab = localStorage.getItem("selectedAccountsTab") as TabValue | null;

        if (!storedTab) {
            localStorage.setItem("selectedAccountsTab", defaultTab);
            setCurrentTab(defaultTab);
        }
    }, [defaultTab]);

    const handleTabChange = (event: React.SyntheticEvent, newTab: TabValue) => {
        setCurrentTab(newTab);
        localStorage.setItem("selectedAccountsTab", newTab);
    };

    return (
        <PageContents requiredPermission="ACC_FCH" title='Accounts'>
            <TabContext value={currentTab}>
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <TabList onChange={handleTabChange}>
                        <Tab label={t("Active")} value="active" />
                        {session?.user && permissionsSet?.has?.("ACC_FCH") && (
                            <Tab label={t("Inactive")} value="inactive" />
                        )}
                    </TabList>
                </Box>
            </TabContext>

            {currentTab === "active" && <ActiveAccountsTab />}
            {currentTab === "inactive" && <InactiveAccountsTab />}
        </PageContents>
    );
}
