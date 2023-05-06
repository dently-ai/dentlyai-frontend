/*
 * Copyright 2017 Palantir Technologies, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from "react";

import { Alignment, AnchorButton, Button, ButtonGroup, Classes, H5, Icon, Intent, Switch } from "@blueprintjs/core";
import { Example, ExampleProps, handleBooleanChange } from "@blueprintjs/docs-theme";
import { Tooltip2 } from "@blueprintjs/popover2";

export interface IBasicEditorState {
    alignText: Alignment;
    fill: boolean;
    iconOnly: boolean;
    intent: Intent;
    minimal: boolean;
    large: boolean;
    vertical: boolean;
}

export class BasicEditor extends React.PureComponent<ExampleProps, IBasicEditorState> {
    public state: IBasicEditorState = {
        alignText: Alignment.CENTER,
        fill: false,
        iconOnly: false,
        intent: Intent.NONE,
        large: false,
        minimal: false,
        vertical: false,
    };

    public render() {
        const { iconOnly, intent, ...bgProps } = this.state;
        // props for every button in the group
        const buttonProps = { intent };

        return (
            <>
                {/* set `minWidth` so `alignText` will have an effect when vertical */}
                <ButtonGroup style={{ minWidth: 200 }} {...bgProps}>
                    <Button {...buttonProps} icon="new-grid-item" text={iconOnly ? undefined : "New Grid"} />
                    <Button {...buttonProps} icon="function" text={iconOnly ? undefined : "Functions"} />
                    <AnchorButton
                        {...buttonProps}
                        icon="cog"
                        rightIcon="settings"
                        text={iconOnly ? undefined : "Options"}
                    />
                </ButtonGroup>
            </>
        );
    }
}