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

import { Alignment, AnchorButton, Button, ButtonGroup, Card, Classes, ControlGroup, H5, Icon, Intent, Label, Slider, Switch } from "@blueprintjs/core";
import { Example, ExampleProps, handleBooleanChange } from "@blueprintjs/docs-theme";
import { Tooltip2 } from "@blueprintjs/popover2";
import { CalibrationControl } from "./CalibrationControl";

export interface IPixiJsAppProps {
    updateBrightness: (newBrightness: number) => void;
    updateContrast: (newContrast: number) => void;
    updateZoom: (newZoom: number) => void;
    handleCalibration?: () => void;
    handleAnalysisChange?: (isEnabled: boolean) => void;
}

export interface IEditorSettingsState {
    isAnalysisEnabled?: boolean;
    brightness?: number;
    contrast?: number;
    zoom?: number;
}

export class EditorSettings extends React.PureComponent<IPixiJsAppProps, IEditorSettingsState> {
    public state: IEditorSettingsState = {
        brightness: 100,
        contrast: 100,
        zoom: 3.0,
        isAnalysisEnabled: false,
    };


    public render() {
        const { handleCalibration, } = this.props;
        const { isAnalysisEnabled, } = this.state;

        return (
            <Card>
                <CalibrationControl handleCalibration={handleCalibration} />
                <ControlGroup className="padded-control level">
                    <div className="level-left">
                        <Switch className="padded-switch" label="Show analysis" checked={isAnalysisEnabled} onChange={this.onAnalysisEnabledChanged.bind(this)} />
                    </div>
                    <div className="level-right">
                        
                    </div>
                </ControlGroup>
                <Label className="bp4-label bp4-inline">
                    Brightness
                    <Slider
                        min={30}
                        max={170}
                        stepSize={1}
                        labelStepSize={35}
                        onChange={this.getChangeHandler("brightness")}
                        value={this.state.brightness}
                        handleHtmlProps={{ "aria-label": "example 1" }}
                    />
                </Label>
                <Label className="bp4-label bp4-inline">
                    Contrast
                    <Slider
                        min={50}
                        max={150}
                        stepSize={1}
                        labelStepSize={25}
                        onChange={this.getChangeHandler("contrast")}
                        value={this.state.contrast}
                        handleHtmlProps={{ "aria-label": "Contrast" }}
                    />
                </Label>
            </Card>
        );
    }

    private getChangeHandler(key: string) {
        return (value: number) => {
            if (key == 'brightness') {
                this.props.updateBrightness(value);
            } else if (key == 'contrast') {
                this.props.updateContrast(value);
            } else if (key == 'zoom') {
                this.props.updateZoom(value);
            }

            this.setState({ [key]: value })
        };
    }

    private onAnalysisEnabledChanged(event: React.FormEvent<HTMLInputElement>): void {
        const { handleAnalysisChange, } = this.props;
        const { isAnalysisEnabled, } = this.state;

        if (handleAnalysisChange != undefined) {
            handleAnalysisChange(!isAnalysisEnabled);
        }

        this.setState({ isAnalysisEnabled: !isAnalysisEnabled });
    }
}